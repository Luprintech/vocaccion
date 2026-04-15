"""
scraper_cursos_sepe.py
======================
Extrae cursos de formación del buscador del SEPE.
Web: sede.sepe.gob.es/buscadorcursos/RXBusqInsCursosWebRED/

Uso:
    pip install requests beautifulsoup4
    python scraper_cursos_sepe.py                        # todos
    python scraper_cursos_sepe.py --tipo ocupados
    python scraper_cursos_sepe.py --tipo desempleados
    python scraper_cursos_sepe.py --provincia 14         # Córdoba
    python scraper_cursos_sepe.py --subvencionados
    python scraper_cursos_sepe.py --continuar
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
OUTPUT_JSON = "cursos_sepe.json"
BASE        = "https://sede.sepe.gob.es/buscadorcursos/RXBusqInsCursosWebRED"
URL_BUSQ    = f"{BASE}/busquedaFormacionAvanzada.do"
URL_RESULT  = f"{BASE}/resultadoBusquedaFormacion.do"
URL_DETALLE = f"{BASE}/detalleBusquedaFormacion.do"

HEADERS = {
    "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
    "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9",
    "Content-Type":    "application/x-www-form-urlencoded",
    "Referer":         URL_BUSQ,
}

DELAY_MIN = 1.5
DELAY_MAX = 3.0

# Códigos de provincia SEPE (select del formulario)
PROVINCIAS = {
    "01": "Álava",        "02": "Albacete",     "03": "Alicante",
    "04": "Almería",      "05": "Ávila",        "06": "Badajoz",
    "07": "Baleares",     "08": "Barcelona",    "09": "Burgos",
    "10": "Cáceres",      "11": "Cádiz",        "12": "Castellón",
    "13": "Ciudad Real",  "14": "Córdoba",      "15": "A Coruña",
    "16": "Cuenca",       "17": "Girona",       "18": "Granada",
    "19": "Guadalajara",  "20": "Guipúzcoa",    "21": "Huelva",
    "22": "Huesca",       "23": "Jaén",         "24": "León",
    "25": "Lleida",       "26": "La Rioja",     "27": "Lugo",
    "28": "Madrid",       "29": "Málaga",       "30": "Murcia",
    "31": "Navarra",      "32": "Ourense",      "33": "Asturias",
    "34": "Palencia",     "35": "Las Palmas",   "36": "Pontevedra",
    "37": "Salamanca",    "38": "S.C. Tenerife","39": "Cantabria",
    "40": "Segovia",      "41": "Sevilla",      "42": "Soria",
    "43": "Tarragona",    "44": "Teruel",       "45": "Toledo",
    "46": "Valencia",     "47": "Valladolid",   "48": "Vizcaya",
    "49": "Zamora",       "50": "Zaragoza",     "51": "Ceuta",
    "52": "Melilla",
}

# Criterios de búsqueda
CRITERIOS = {
    "todos":        "T",
    "ocupados":     "O",
    "desempleados": "D",
}
# ──────────────────────────────────────────────────────────────────────────────


def busqueda_inicial(session, criterio="T", provincia="", subvencionados=False):
    """Primera petición — devuelve HTML de resultados página 1."""
    payload = {
        "metodo":              "BUSCAR",
        "textoBusqueda":       "",
        "criterio":            criterio,
        "fechaInicio":         "",
        "fechaFin":            "",
        "provincia":           provincia,
        "subvencionados":      "S" if subvencionados else "",
        "numeroPagina":        "1",
        "totalPaginas":        "1",
        "orderBy":             "titulo",
        "descendente":         "false",
        "inicio":              "true",
        "fin":                 "false",
        "numeroRegistros":     "0",
        "volverUrl":           "",
    }
    resp = session.post(URL_RESULT, data=payload, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    resp.encoding = "iso-8859-1"
    return resp.text


def siguiente_pagina(session, pagina, total_paginas, total_registros, criterio, provincia, subvencionados):
    """Petición de paginación."""
    payload = {
        "metodo":          "PAGINAR",
        "textoBusqueda":   "",
        "criterio":        criterio,
        "fechaInicio":     "",
        "fechaFin":        "",
        "provincia":       provincia,
        "subvencionados":  "S" if subvencionados else "",
        "numeroPagina":    str(pagina),
        "totalPaginas":    str(total_paginas),
        "orderBy":         "titulo",
        "descendente":     "false",
        "inicio":          "false",
        "fin":             str(pagina >= total_paginas).lower(),
        "numeroRegistros": str(total_registros),
        "volverUrl":       "",
    }
    resp = session.post(URL_RESULT, data=payload, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    resp.encoding = "iso-8859-1"
    return resp.text


def parsear_resultados(html):
    """Extrae cursos y metadatos de paginación del HTML de resultados."""
    soup = BeautifulSoup(html, "html.parser")
    cursos = []

    # Metadatos de paginación
    total_registros = 0
    total_paginas   = 1
    pagina_actual   = 1

    caption = soup.find("caption")
    if caption:
        m = re.search(r"(\d+)\s+cursos", caption.get_text())
        if m:
            total_registros = int(m.group(1))

    # Campos hidden
    def hidden(name):
        el = soup.find("input", {"name": name})
        return el["value"] if el else ""

    total_paginas = int(hidden("totalPaginas") or 1)
    pagina_actual = int(hidden("numeroPagina") or 1)

    # Filas de resultados
    tabla = soup.find("table", id="tabla_datos")
    if not tabla:
        return cursos, pagina_actual, total_paginas, total_registros

    for fila in tabla.find_all("tr"):
        celdas = fila.find_all("td")
        if len(celdas) < 5:
            continue

        curso = {}

        # Título e ID
        enlace = celdas[0].find("a")
        if enlace:
            curso["titulo"] = enlace.get_text(strip=True)
            href = enlace.get("href", "")
            m_id = re.search(r"idBusquedaFormacion=(\d+)", href)
            curso["id_curso"] = int(m_id.group(1)) if m_id else None
            curso["url"] = f"{BASE}/{href}" if not href.startswith("http") else href
        else:
            curso["titulo"]   = celdas[0].get_text(strip=True)
            curso["id_curso"] = None
            curso["url"]      = ""

        curso["localidad"]      = celdas[1].get_text(strip=True) if len(celdas) > 1 else ""
        curso["provincia"]      = celdas[2].get_text(strip=True) if len(celdas) > 2 else ""
        curso["fecha_comienzo"] = celdas[3].get_text(strip=True) if len(celdas) > 3 else ""
        curso["origen"]         = celdas[4].get_text(strip=True) if len(celdas) > 4 else ""
        curso["horas"]          = int(celdas[5].get_text(strip=True)) if len(celdas) > 5 and celdas[5].get_text(strip=True).isdigit() else None

        if curso.get("titulo"):
            cursos.append(curso)

    return cursos, pagina_actual, total_paginas, total_registros


def cargar_previos(path):
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        lista = json.load(f)
    return {str(item.get("id_curso", i)): item for i, item in enumerate(lista)}


def guardar(path, resultados):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(list(resultados.values()), f, ensure_ascii=False, indent=2)


def scrapear(session, criterio, provincia, subvencionados, resultados):
    tipo_str = {v: k for k, v in CRITERIOS.items()}.get(criterio, criterio)
    prov_str = PROVINCIAS.get(provincia, "todas las provincias")
    print(f"\n📋 SEPE cursos — {tipo_str} — {prov_str}")

    # Página 1
    try:
        html = busqueda_inicial(session, criterio, provincia, subvencionados)
    except Exception as e:
        print(f"  ⚠️  Error en búsqueda inicial: {e}")
        return resultados

    cursos, pagina, total_paginas, total_registros = parsear_resultados(html)
    print(f"  Total registros: {total_registros} en {total_paginas} páginas")

    nuevos = 0
    for c in cursos:
        clave = str(c.get("id_curso") or c.get("titulo"))
        if clave not in resultados:
            c["criterio"] = tipo_str
            resultados[clave] = c
            nuevos += 1
    print(f"  Pág 1/{total_paginas}: {len(cursos)} cursos ({nuevos} nuevos)")

    # Páginas siguientes
    for pag in range(2, total_paginas + 1):
        time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
        try:
            html = siguiente_pagina(session, pag, total_paginas,
                                    total_registros, criterio,
                                    provincia, subvencionados)
            cursos, _, _, _ = parsear_resultados(html)
            nuevos = 0
            for c in cursos:
                clave = str(c.get("id_curso") or c.get("titulo"))
                if clave not in resultados:
                    c["criterio"] = tipo_str
                    resultados[clave] = c
                    nuevos += 1
            print(f"  Pág {pag}/{total_paginas}: {len(cursos)} cursos ({nuevos} nuevos) — acum: {len(resultados)}")
        except Exception as e:
            print(f"  ⚠️  Error pág {pag}: {e}")
            break

    return resultados


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--tipo",          choices=["todos", "ocupados", "desempleados"], default="todos")
    parser.add_argument("--provincia",     default="",    help="Código provincia (ej: 14 para Córdoba)")
    parser.add_argument("--subvencionados", action="store_true")
    parser.add_argument("--continuar",     action="store_true")
    args = parser.parse_args()

    resultados = cargar_previos(OUTPUT_JSON) if args.continuar else {}
    session    = requests.Session()
    criterio   = CRITERIOS.get(args.tipo, "T")

    resultados = scrapear(session, criterio, args.provincia, args.subvencionados, resultados)
    guardar(OUTPUT_JSON, resultados)
    print(f"\n✅ {len(resultados)} cursos en '{OUTPUT_JSON}'")


if __name__ == "__main__":
    main()
