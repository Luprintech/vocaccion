"""
scraper_certificados.py
=======================
Extrae todos los certificados/especialidades formativas del buscador del SEPE.

Estrategia:
  1. POST inicial → obtiene idNavegacion + página 1
  2. Pagina con metodo=SIGUIENTE hasta totalPaginas
  3. Para cada certificado modulado → obtiene detalle (ocupaciones, módulos)
  4. Guarda en certificados_profesionales_sepe.json (checkpoint cada 50 págs)

Uso:
    pip install requests beautifulsoup4
    python scraper_certificados.py              # todo (~1135 páginas)
    python scraper_certificados.py --limite 3   # prueba (3 páginas)
    python scraper_certificados.py --continuar  # reanudar
    python scraper_certificados.py --sin-detalle # solo listado, sin fichas
"""

import argparse
import json
import time
import random
import os
import re

import requests
from bs4 import BeautifulSoup

# ── Config ─────────────────────────────────────────────────────────────────────
OUTPUT_JSON  = "certificados_profesionales_sepe.json"
BASE_SEPE    = "https://sede.sepe.gob.es"
LISTAR_URL   = f"{BASE_SEPE}/especialidadesformativas/RXBuscadorEFRED/ListarEspecialidades.do"
DETALLE_BASE = f"{BASE_SEPE}/FOET_CATALOGO_EEFF_SEDE/flows/buscarEspecialidadesNA"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9",
    "Content-Type": "application/x-www-form-urlencoded",
    "Origin": BASE_SEPE,
    "Referer": f"{BASE_SEPE}/especialidadesformativas/RXBuscadorEFRED/EntradaBuscadorCertificadosFormDual.do",
}

DELAY_MIN = 0.8
DELAY_MAX = 2.0
# ──────────────────────────────────────────────────────────────────────────────


def parsear_pagina(html):
    """Extrae certificados de una página de resultados y el estado de paginación."""
    soup = BeautifulSoup(html, "html.parser")
    certificados = []

    # Estado de paginación desde inputs hidden
    estado = {}
    for inp in soup.find_all("input", {"name": True}):
        nombre = inp.get("name", "")
        valor  = inp.get("value", "")
        if nombre in ("idNavegacion", "numeroPagina", "totalPaginas",
                      "numeroRegistros", "inicio", "fin"):
            estado[nombre] = valor

    # Familia y área actuales (están en las filas de la tabla)
    familia_actual = ""
    familia_codigo = ""
    area_actual    = ""
    area_codigo    = ""

    tabla = soup.find("table")
    if not tabla:
        return certificados, estado

    for fila in tabla.find_all("tr"):
        # Familia y área están en <th>, datos en <td>
        ths    = fila.find_all("th")
        celdas = fila.find_all("td")

        # Fila de familia o área (solo tiene TH)
        if ths and not celdas:
            texto_th = ths[0].get_text(strip=True)
            if "Familia Profesional:" in texto_th:
                m = re.search(r":\s*(.+?)\s*\(([A-Z]{2,4})\)", texto_th)
                if m:
                    familia_actual = m.group(1).strip().title()
                    familia_codigo = m.group(2).strip()
                area_actual = ""
                area_codigo = ""
            elif "profesional:" in texto_th.lower():
                m = re.search(r":\s*(.+?)\s*\(([A-Z]{2,6})\)", texto_th)
                if m:
                    area_actual = m.group(1).strip().title()
                    area_codigo = m.group(2).strip()
            continue

        if not celdas:
            continue

        # Fila de cabecera (Código, Nivel...) — saltamos
        if celdas[0].get_text(strip=True) in ("Código", ""):
            continue

        # Fila de datos
        enlace = celdas[0].find("a") if celdas else None
        if not enlace:
            continue

        codigo   = enlace.get_text(strip=True)
        href     = enlace.get("href", "")
        nivel_tx = celdas[1].get_text(strip=True) if len(celdas) > 1 else ""
        denom    = celdas[2].get_text(strip=True) if len(celdas) > 2 else ""
        duracion = celdas[3].get_text(strip=True) if len(celdas) > 3 else ""
        modulada = celdas[4].get_text(strip=True) if len(celdas) > 4 else ""
        cert_p   = celdas[5].get_text(strip=True) if len(celdas) > 5 else ""
        h_tele   = celdas[6].get_text(strip=True) if len(celdas) > 6 else ""
        centros  = celdas[7].get_text(strip=True) if len(celdas) > 7 else ""

        # URL de detalle: /FOET_CATALOGO_EEFF_SEDE/flows/buscarEspecialidadesNA?especialidadId=ADGD0001
        detalle_url = BASE_SEPE + href if href.startswith("/") else href

        certificados.append({
            "codigo":             codigo,
            "denominacion":       denom.title(),
            "familia_codigo":     familia_codigo,
            "familia":            familia_actual,
            "area_codigo":        area_codigo,
            "area":               area_actual,
            "nivel":              int(nivel_tx) if nivel_tx.isdigit() else nivel_tx,
            "horas_totales":      int(duracion) if duracion.isdigit() else None,
            "modulada":           modulada.upper() == "SI",
            "certificado_prof":   cert_p.upper() == "SI",
            "horas_teleformacion": int(h_tele) if h_tele.isdigit() else None,
            "centros_asociados":  centros,
            "detalle_url":        detalle_url,
        })

    return certificados, estado


def parsear_detalle(html):
    """Extrae ocupaciones, competencia general y módulos del detalle."""
    soup = BeautifulSoup(html, "html.parser")
    detalle = {
        "competencia_general":  "",
        "entorno_profesional":  "",
        "sectores_productivos": [],
        "ocupaciones":          [],
        "unidades_competencia": [],
        "modulos_formativos":   [],
        "requisitos_acceso":    "",
    }

    texto_completo = soup.get_text(separator="\n")

    # Extracción por secciones — busca patrones en el texto
    secciones = {
        "competencia_general":  r"COMPETENCIA GENERAL[:\s]*\n(.+?)(?=\n[A-ZÁÉÍÓÚ]{4,}|\Z)",
        "entorno_profesional":  r"ENTORNO PROFESIONAL[:\s]*\n(.+?)(?=\n[A-ZÁÉÍÓÚ]{4,}|\Z)",
        "requisitos_acceso":    r"REQUISITOS DE ACCESO[:\s]*\n(.+?)(?=\n[A-ZÁÉÍÓÚ]{4,}|\Z)",
    }
    for campo, patron in secciones.items():
        m = re.search(patron, texto_completo, re.S | re.IGNORECASE)
        if m:
            detalle[campo] = m.group(1).strip()[:500]

    # Ocupaciones: busca listas con códigos CNO
    ocup_matches = re.findall(r"\b(\d{4})\s+([^\n\r]{5,80})", texto_completo)
    if ocup_matches:
        detalle["ocupaciones"] = [
            {"codigo_cno": c, "denominacion": d.strip()}
            for c, d in ocup_matches[:20]
        ]

    # Módulos formativos desde tablas
    for tabla in soup.find_all("table"):
        cab = tabla.find("tr")
        if not cab:
            continue
        cab_texto = cab.get_text(strip=True).lower()
        if "módulo" in cab_texto or "modulo" in cab_texto or "mf" in cab_texto:
            for fila in tabla.find_all("tr")[1:]:
                celdas = [td.get_text(strip=True) for td in fila.find_all("td")]
                if celdas and any(c for c in celdas):
                    detalle["modulos_formativos"].append(celdas)

    return detalle


def siguiente_pagina(session, estado):
    """Solicita la siguiente página usando el estado de paginación."""
    payload = {
        "metodo":          "SIGUIENTE",
        "idNavegacion":    estado.get("idNavegacion", ""),
        "numeroPagina":    estado.get("numeroPagina", "1"),
        "totalPaginas":    estado.get("totalPaginas", "1"),
        "numeroRegistros": estado.get("numeroRegistros", "10"),
        "inicio":          "false",
        "fin":             "false",
        "orderBy":         "",
        "descendente":     "false",
        "navigationtag":   "PROCEDIMIENTOS_CIUDADANOS",
        "criterioBusqueda.idFamiliaProfesional": "",
        "criterioBusqueda.codAreaProfesional":   "",
        "criterioBusqueda.denominacion":         "",
        "criterioBusqueda.idEspecialidad":       "",
        "criterioBusqueda.codCentro":            "",
        "criterioBusqueda.denomFamilia":         "",
        "criterioBusqueda.denomArea":            "",
        "criterioBusqueda.denomCentro":          "",
        "criterioBusqueda.codTipoEspecialidad":  "",
        "criterioBusqueda.codOcupacion":         "",
        "criterioBusqueda.denomCodOcupacion":    "",
        "busquedaURL":     "",
    }
    resp = session.post(LISTAR_URL, data=payload, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    resp.encoding = "iso-8859-1"
    return resp.text


def cargar_previos(path):
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        lista = json.load(f)
    return {item["codigo"]: item for item in lista}


def guardar(path, resultados):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(list(resultados.values()), f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limite",      type=int, default=0,
                        help="Número máximo de PÁGINAS a procesar (0=todas)")
    parser.add_argument("--continuar",   action="store_true")
    parser.add_argument("--sin-detalle", action="store_true",
                        help="Solo listado, no descarga fichas individuales")
    args = parser.parse_args()

    session  = requests.Session()
    previos  = cargar_previos(OUTPUT_JSON) if args.continuar else {}
    resultados = dict(previos)

    # ── Página 1: búsqueda inicial ─────────────────────────────────────────────
    print("📋 Iniciando búsqueda en el SEPE...", end=" ", flush=True)
    payload_inicial = {
        "excluyente":    "1",
        "idEspecialidad": "",
        "metodo":        "BUSCAR",
        "navigationtag": "PROCEDIMIENTOS_CIUDADANOS",
    }
    resp = session.post(LISTAR_URL, data=payload_inicial, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    resp.encoding = "iso-8859-1"
    html = resp.text

    certs_pag, estado = parsear_pagina(html)
    total_paginas = int(estado.get("totalPaginas", 1))
    print(f"OK | {total_paginas} páginas (~{total_paginas * int(estado.get('numeroRegistros',7))} especialidades)")

    paginas_a_procesar = args.limite if args.limite else total_paginas

    # ── Bucle de paginación ────────────────────────────────────────────────────
    pagina_actual = 1
    while pagina_actual <= paginas_a_procesar:
        nuevos = [c for c in certs_pag if c["codigo"] not in resultados]
        print(f"  Pág {pagina_actual}/{paginas_a_procesar} → {len(certs_pag)} registros ({len(nuevos)} nuevos)")

        for cert in nuevos:
            resultados[cert["codigo"]] = cert

            # Detalle solo para modulados (tienen ficha completa)
            if not args.sin_detalle and cert.get("modulada"):
                try:
                    resp_det = session.get(
                        cert["detalle_url"], headers=HEADERS, timeout=15
                    )
                    resp_det.raise_for_status()
                    resp_det.encoding = "iso-8859-1"
                    det = parsear_detalle(resp_det.text)
                    resultados[cert["codigo"]].update(det)
                    n_ocup = len(det.get("ocupaciones", []))
                    print(f"    {cert['codigo']} — {cert['denominacion'][:45]} ✅ {n_ocup} ocup.")
                    time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
                except Exception as e:
                    print(f"    {cert['codigo']} ⚠️  {e}")

        # Checkpoint cada 50 páginas
        if pagina_actual % 50 == 0:
            guardar(OUTPUT_JSON, resultados)
            print(f"  💾 Checkpoint: {len(resultados)} especialidades guardadas")

        # Siguiente página
        if pagina_actual >= paginas_a_procesar:
            break

        # Renovar sesión cada 900 páginas para evitar corte del servidor
        if pagina_actual % 900 == 0:
            print(f"  🔄 Renovando sesión en pág {pagina_actual}...")
            session.close()
            time.sleep(random.uniform(5, 10))
            session = requests.Session()
            # Reiniciar búsqueda para obtener nuevo idNavegacion
            try:
                payload_nuevo = {
                    "excluyente": "1", "idEspecialidad": "",
                    "metodo": "BUSCAR", "navigationtag": "PROCEDIMIENTOS_CIUDADANOS",
                }
                resp_nuevo = session.post(LISTAR_URL, data=payload_nuevo, headers=HEADERS, timeout=30)
                resp_nuevo.raise_for_status()
                resp_nuevo.encoding = "iso-8859-1"
                # Avanzar hasta la página actual paginando
                _, estado_nuevo = parsear_pagina(resp_nuevo.text)
                estado = estado_nuevo
                print(f"  ✅ Sesión renovada")
            except Exception as e_ses:
                print(f"  ⚠️  Error renovando sesión: {e_ses}")

        try:
            html = siguiente_pagina(session, estado)
            certs_pag, estado = parsear_pagina(html)
            pagina_actual += 1
            # Delay adaptativo: rápido si no hay nuevos, lento si hay datos nuevos
            hay_nuevos = any(c["codigo"] not in resultados for c in certs_pag)
            time.sleep(random.uniform(0.15, 0.4) if not hay_nuevos else random.uniform(1.0, 2.0))
        except Exception as e:
            print(f"⚠️  Error en paginación pág {pagina_actual}: {e}")
            print(f"  Esperando 30s antes de reintentar...")
            time.sleep(30)
            # Reintentar con sesión nueva
            try:
                session.close()
                session = requests.Session()
                payload_retry = {
                    "excluyente": "1", "idEspecialidad": "",
                    "metodo": "BUSCAR", "navigationtag": "PROCEDIMIENTOS_CIUDADANOS",
                }
                resp_retry = session.post(LISTAR_URL, data=payload_retry, headers=HEADERS, timeout=30)
                resp_retry.raise_for_status()
                resp_retry.encoding = "iso-8859-1"
                certs_pag, estado = parsear_pagina(resp_retry.text)
                pagina_actual += 1
                print(f"  ✅ Reintento exitoso")
            except Exception as e2:
                print(f"⚠️  Reintento fallido: {e2}. Guardando y saliendo.")
                break

    guardar(OUTPUT_JSON, resultados)
    print(f"\n🏁 Completado. {len(resultados)} especialidades en '{OUTPUT_JSON}'")


if __name__ == "__main__":
    main()
