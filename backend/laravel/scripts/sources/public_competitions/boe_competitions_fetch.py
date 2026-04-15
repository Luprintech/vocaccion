"""
scraper_oposiciones_boe.py
==========================
Extrae convocatorias de oposiciones del BOE via API oficial.
Sección II.B - Oposiciones y concursos.

API oficial: https://www.boe.es/datosabiertos/api/
Sin autenticación, sin límite documentado, datos abiertos.

Uso:
    pip install requests
    python scraper_oposiciones_boe.py                    # últimos 30 días
    python scraper_oposiciones_boe.py --dias 90          # últimos 90 días
    python scraper_oposiciones_boe.py --desde 2025-01-01 # desde fecha
    python scraper_oposiciones_boe.py --continuar        # solo nuevos
"""

import argparse
import json
import time
import random
import os
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

import requests

# ── Config ─────────────────────────────────────────────────────────────────────
OUTPUT_JSON  = "oposiciones_boe.json"
API_BASE     = "https://www.boe.es/datosabiertos/api"
BOE_BASE     = "https://www.boe.es"

HEADERS = {
    "Accept":          "application/xml",
    "User-Agent":      "Vocaccion/1.0 (orientacion vocacional; contacto@luprintech.com)",
    "Accept-Language": "es-ES,es;q=0.9",
}

DELAY_MIN = 1.0
DELAY_MAX = 2.5

# Palabras clave para identificar oposiciones (filtro adicional por título)
KEYWORDS_OPOSICION = [
    "oposici", "concurso-oposici", "proceso selectivo", "pruebas selectivas",
    "convocatoria.*plazas", "ingreso.*cuerpo", "acceso libre", "promoción interna",
    "personal laboral", "funcionario", "escala", "cuerpo superior",
]
# ──────────────────────────────────────────────────────────────────────────────


def obtener_sumario(session, fecha: str):
    """
    Obtiene el sumario del BOE de una fecha dada.
    fecha formato: YYYYMMDD
    Devuelve XML parseado o None si no hay BOE ese día.
    """
    url = f"{API_BASE}/boe/sumario/{fecha}"
    try:
        resp = session.get(url, headers=HEADERS, timeout=30)
        if resp.status_code == 404:
            return None  # No hay BOE ese día (fin de semana, festivo)
        resp.raise_for_status()
        return ET.fromstring(resp.content)
    except ET.ParseError as e:
        print(f"  ⚠️  Error XML {fecha}: {e}")
        return None
    except requests.RequestException as e:
        print(f"  ⚠️  Error HTTP {fecha}: {e}")
        return None


def extraer_oposiciones(root, fecha: str):
    """
    Extrae las entradas de la sección II.B (Oposiciones y concursos) del sumario.
    Estructura BOE: sumario > diario > seccion[@num="2"] > departamento > epigrafe > item
    """
    oposiciones = []

    # Buscar sección 2 (Autoridades y personal) subsección B (Oposiciones)
    for seccion in root.iter("seccion"):
        num = seccion.get("num", "")
        nombre = seccion.get("nombre", "").upper()

        # Sección II - Autoridades y Personal
        if num != "2" and "AUTORIDADES" not in nombre:
            continue

        # Buscar el epígrafe B - Oposiciones y concursos
        for epigrafe in seccion.iter("epigrafe"):
            nombre_ep = epigrafe.get("nombre", "").upper()
            if "OPOSICI" not in nombre_ep and "CONCURSO" not in nombre_ep:
                continue

            # Extraer cada item (convocatoria)
            for item in epigrafe.iter("item"):
                opos = parsear_item(item, fecha)
                if opos:
                    oposiciones.append(opos)

    return oposiciones


def parsear_item(item, fecha: str):
    """Extrae datos de un item del sumario BOE."""
    opos = {}

    # Identificador único
    opos["id_boe"] = item.findtext("identificador", "").strip()
    if not opos["id_boe"]:
        return None

    # Título
    opos["titulo"] = item.findtext("titulo", "").strip()

    # Departamento/organismo
    dep = item.find("../../../..")  # departamento padre
    if dep is None:
        dep = item.find("../../..")
    opos["organismo"] = ""
    if dep is not None:
        opos["organismo"] = dep.findtext("nombre", "").strip() or \
                            dep.get("nombre", "").strip()

    # URLs
    urls = item.find("url_pdf")
    opos["url_pdf"]  = BOE_BASE + item.findtext("url_pdf",  "").strip()
    opos["url_xml"]  = BOE_BASE + item.findtext("url_xml",  "").strip()
    opos["url_html"] = BOE_BASE + item.findtext("url_html", "").strip()

    opos["fecha_publicacion"] = fecha
    opos["fecha_iso"] = f"{fecha[:4]}-{fecha[4:6]}-{fecha[6:8]}"

    # Extraer metadatos clave del título
    titulo_lower = opos["titulo"].lower()

    # Número de plazas
    m_plazas = re.search(r"(\d+)\s+plaza", titulo_lower)
    opos["plazas"] = int(m_plazas.group(1)) if m_plazas else None

    # Tipo de acceso
    if "acceso libre" in titulo_lower:
        opos["tipo_acceso"] = "libre"
    elif "promoción interna" in titulo_lower or "promoición interna" in titulo_lower:
        opos["tipo_acceso"] = "promocion_interna"
    elif "concurso" in titulo_lower and "oposici" not in titulo_lower:
        opos["tipo_acceso"] = "concurso"
    else:
        opos["tipo_acceso"] = "oposicion"

    # Administración
    if any(x in titulo_lower for x in ["estado", "ministerio", "administración general"]):
        opos["ambito"] = "estatal"
    elif any(x in titulo_lower for x in ["comunidad", "junta", "generalitat", "xunta"]):
        opos["ambito"] = "autonomico"
    elif any(x in titulo_lower for x in ["ayuntamiento", "diputación", "municipio"]):
        opos["ambito"] = "local"
    elif any(x in titulo_lower for x in ["universidad"]):
        opos["ambito"] = "universidad"
    else:
        opos["ambito"] = "otro"

    # Titulación requerida (inferida del título)
    if any(x in titulo_lower for x in ["grado", "licenciado", "ingeniero", "arquitecto", "superior"]):
        opos["grupo"] = "A1"
    elif any(x in titulo_lower for x in ["diplomado", "técnico superior", "grado medio", "subgrupo a2"]):
        opos["grupo"] = "A2"
    elif any(x in titulo_lower for x in ["bachiller", "grupo b", "subgrupo b"]):
        opos["grupo"] = "B"
    elif any(x in titulo_lower for x in ["graduado escolar", "grupo c", "auxiliar", "administrativo"]):
        opos["grupo"] = "C"
    else:
        opos["grupo"] = ""

    return opos


def fechas_a_procesar(dias=30, desde=None):
    """Genera lista de fechas a procesar en formato YYYYMMDD."""
    hoy = datetime.now()
    if desde:
        inicio = datetime.strptime(desde, "%Y-%m-%d")
    else:
        inicio = hoy - timedelta(days=dias)

    fechas = []
    current = inicio
    while current <= hoy:
        # Solo días laborables (lunes a viernes)
        if current.weekday() < 5:
            fechas.append(current.strftime("%Y%m%d"))
        current += timedelta(days=1)

    return fechas


def cargar_previos(path):
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        lista = json.load(f)
    return {item["id_boe"]: item for item in lista if item.get("id_boe")}


def guardar(path, resultados):
    # Ordenar por fecha descendente
    lista = sorted(resultados.values(),
                   key=lambda x: x.get("fecha_iso", ""),
                   reverse=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(lista, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dias",      type=int, default=30,   help="Últimos N días (default: 30)")
    parser.add_argument("--desde",     default=None,           help="Desde fecha YYYY-MM-DD")
    parser.add_argument("--continuar", action="store_true",    help="Solo añadir nuevas")
    args = parser.parse_args()

    resultados = cargar_previos(OUTPUT_JSON) if args.continuar else {}
    session    = requests.Session()
    fechas     = fechas_a_procesar(args.dias, args.desde)

    print(f"📋 BOE Oposiciones — procesando {len(fechas)} días laborables")
    if args.continuar:
        print(f"   (modo continuar: {len(resultados)} ya procesadas)")

    total_nuevas = 0

    for i, fecha in enumerate(fechas):
        fecha_legible = f"{fecha[6:8]}/{fecha[4:6]}/{fecha[:4]}"
        print(f"  [{i+1}/{len(fechas)}] {fecha_legible}...", end=" ", flush=True)

        # Saltar si ya tenemos datos de ese día en modo continuar
        if args.continuar:
            ya_procesado = any(
                v.get("fecha_publicacion") == fecha
                for v in resultados.values()
            )
            if ya_procesado:
                print("ya procesado")
                continue

        root = obtener_sumario(session, fecha)
        if root is None:
            print("sin BOE")
            continue

        oposiciones = extraer_oposiciones(root, fecha)

        nuevas = 0
        for opos in oposiciones:
            if opos["id_boe"] not in resultados:
                resultados[opos["id_boe"]] = opos
                nuevas += 1
                total_nuevas += 1

        print(f"{len(oposiciones)} oposiciones ({nuevas} nuevas)")

        if nuevas > 0:
            guardar(OUTPUT_JSON, resultados)

        time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    guardar(OUTPUT_JSON, resultados)

    total = len(resultados)
    print(f"\n✅ Total: {total} convocatorias en '{OUTPUT_JSON}'")
    print(f"   Nuevas esta ejecución: {total_nuevas}")

    # Resumen por ámbito
    if total > 0:
        lista = list(resultados.values())
        print("\n📊 Por ámbito:")
        for ambito in ["estatal", "autonomico", "local", "universidad", "otro"]:
            n = sum(1 for x in lista if x.get("ambito") == ambito)
            if n:
                print(f"   {ambito:15}: {n}")
        print("\n📊 Por grupo:")
        for grupo in ["A1", "A2", "B", "C", ""]:
            n = sum(1 for x in lista if x.get("grupo") == grupo)
            label = grupo if grupo else "sin clasificar"
            if n:
                print(f"   {label:15}: {n}")


if __name__ == "__main__":
    main()
