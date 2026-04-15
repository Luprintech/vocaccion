#!/usr/bin/env python3
"""
Scraper de notas de corte universitarias — QEDU
Ministerio de Ciencia, Innovación y Universidades (España)

Fuente: https://www.ciencia.gob.es/qedu.html
Endpoint: POST https://www.ciencia.gob.es/home/qedu/main/zona02/0

Uso:
    python scrape_qedu.py                    # Grados (por defecto)
    python scrape_qedu.py --nivel GRADO      # Solo grados
    python scrape_qedu.py --nivel MASTER     # Solo másteres
    python scrape_qedu.py --nivel ALL        # Todos los niveles
    python scrape_qedu.py --ambito 509       # Filtrar por ámbito ISCED (ej: Ingenierías)
    python scrape_qedu.py --ccaa andalucia   # Filtrar por CCAA en post-proceso

 Salida:
    ../../database/data/catalog/notas_de_corte/raw/notas_de_corte_<nivel>_<fecha>.json
    ../../database/data/catalog/notas_de_corte/raw/notas_de_corte_latest.json  (copia al más reciente)

Ámbitos ISCED disponibles (filtros de la web):
    Educación:                143, 144, 149, 109
    Artes y humanidades:      213, 219, 228, 229, 209
    Ciencias sociales:        311, 314, 319, 320, 345, 349, 380, 309
    Ciencias e informática:   420, 440, 460, 409, 480
    Ingeniería:               509, 580
    Agricultura/veterinaria:  620, 640, 609
    Salud:                    720, 721, 723, 724, 725, 726, 729
    Servicios:                811, 813, 814, 815, 816, 817, 819
"""

import argparse
import json
import os
import sys
import time
from datetime import date
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: Módulo 'requests' no instalado. Ejecuta: pip install requests")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------
QEDU_URL = "https://www.ciencia.gob.es/home/qedu/main/zona02/0"
PAGE_SIZE = 12          # La API pagina de 12 en 12
DELAY_BETWEEN = 0.5    # Segundos entre requests (respetar al servidor)
MAX_RETRIES = 3         # Reintentos por página en caso de error

NIVELES_DISPONIBLES = {
    "GRADO":   "'GRADO'",
    "GRADOD":  "'GRADOD'",
    "MASTER":  "'MASTER'",
    "MASTERD": "'MASTERD'",
    "DOCTOR":  "'DOCTOR'",
    "ALL":     "'GRADO','GRADOD','MASTER','MASTERD','DOCTOR'",
}

OUTPUT_DIR = Path(__file__).parent.parent.parent.parent / "database" / "data" / "catalog" / "notas_de_corte" / "raw"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def build_session():
    """Crea sesión HTTP con headers que imitan al navegador."""
    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Referer": "https://www.ciencia.gob.es/qedu.html",
        "Origin": "https://www.ciencia.gob.es",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "es-ES,es;q=0.9",
        "X-Requested-With": "XMLHttpRequest",
    })
    return session


def fetch_all(session, niveles_str: str, ambitos: str = "", consulta: str = "") -> list:
    """
    Llama a la API QEDU y devuelve TODOS los resultados en una sola petición.

    Nota: aunque la web usa offset para mostrar de 12 en 12, la API del servidor
    devuelve el dataset completo independientemente del offset. El filtrado/paginación
    es del lado cliente (JavaScript). Por eso basta con una sola llamada.
    """
    payload = {
        "action": "tarjeta",
        "offset": 0,
        "consulta": consulta,
        "niveles": niveles_str,
        "ambitos": ambitos,
    }
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"  Descargando dataset completo...", end=" ", flush=True)
            resp = session.post(QEDU_URL, data=payload, timeout=60)
            resp.raise_for_status()
            # La API del Ministerio devuelve JSON en latin-1 / iso-8859-1
            # (no declara charset en Content-Type). Forzamos latin-1 para
            # que requests decodifique correctamente los caracteres españoles.
            resp.encoding = "iso-8859-1"
            data = resp.json()
            if isinstance(data, list):
                print(f"{len(data)} registros recibidos")
                return data
            return []
        except requests.exceptions.RequestException as exc:
            print(f"\n  [!] Intento {attempt}/{MAX_RETRIES} falló: {exc}", file=sys.stderr)
            if attempt < MAX_RETRIES:
                time.sleep(2 ** attempt)
    return []


def scrape_all(session, niveles_str: str, ambitos: str = "", consulta: str = "") -> list:
    """Wrapper que llama fetch_all (una sola petición al servidor)."""
    return fetch_all(session, niveles_str, ambitos, consulta)


def normalize_record(record: dict) -> dict:
    """Normaliza un registro: tipos, valores nulos, campos estandarizados."""
    def to_float_or_none(val):
        if val is None or val == "" or val == "0" or val == 0:
            return None
        try:
            return float(str(val).replace(",", "."))
        except (ValueError, TypeError):
            return None

    return {
        "cod_titulacion":    record.get("codTitula"),
        "cod_centro":        record.get("codCentro"),
        "cod_universidad":   record.get("codUniv"),
        "titulacion":        record.get("titulacion", "").strip(),
        "nivel":             record.get("nivel"),
        "tipo_universidad":  record.get("tipoUniversidad"),
        "tipo_centro":       record.get("tipoCentro"),
        "nombre_centro":     record.get("nombreCentro", "").strip(),
        "nombre_universidad": record.get("nombreUniversidad", "").strip(),
        "ccaa":              record.get("ccaa", "").strip(),
        "provincia":         record.get("provincia", "").strip(),
        "cod_provincia":     record.get("codProvi"),
        "modalidad":         record.get("modalidad"),
        "idioma_extranjero": record.get("idiomaextranjero") == "1",
        "nota_corte":        to_float_or_none(record.get("notaCorte")),
        "anio":              record.get("anio"),
    }


def deduplicate(records: list) -> list:
    """Elimina duplicados por (cod_titulacion, cod_centro, cod_universidad)."""
    seen = set()
    out = []
    for r in records:
        key = (r["cod_titulacion"], r["cod_centro"], r["cod_universidad"])
        if key not in seen:
            seen.add(key)
            out.append(r)
    return out


def save(records: list, nivel_key: str):
    """Guarda los resultados en JSON."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    today = date.today().isoformat()
    filename = f"notas_de_corte_{nivel_key.lower()}_{today}.json"
    filepath = OUTPUT_DIR / filename

    payload = {
        "fuente": "QEDU — Ministerio de Ciencia, Innovación y Universidades",
        "url": "https://www.ciencia.gob.es/qedu.html",
        "fecha_extraccion": today,
        "nivel": nivel_key,
        "total": len(records),
        "datos": records,
    }
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    # Copia como "latest"
    latest_path = OUTPUT_DIR / f"notas_de_corte_{nivel_key.lower()}_latest.json"
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"\nGuardado: {filepath}")
    print(f"Latest:   {latest_path}")
    return filepath


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Scraper de notas de corte universitarias — QEDU (Ministerio Ciencia)"
    )
    parser.add_argument(
        "--nivel",
        default="GRADO",
        choices=list(NIVELES_DISPONIBLES.keys()),
        help="Nivel de titulación a descargar (default: GRADO)",
    )
    parser.add_argument(
        "--ambito",
        default="",
        help="Código ISCED de ámbito para filtrar (ej: 509 para Ingenierías). Vacío = todos.",
    )
    parser.add_argument(
        "--consulta",
        default="",
        help="Keyword para filtrar por nombre de titulación (ej: 'medicina'). Vacío = todos.",
    )
    args = parser.parse_args()

    nivel_key = args.nivel
    niveles_str = NIVELES_DISPONIBLES[nivel_key]
    ambitos_str = args.ambito
    consulta_str = args.consulta

    print("=" * 60)
    print("  QEDU — Notas de corte universitarias (España)")
    print(f"  Nivel:    {nivel_key}")
    print(f"  Ámbito:   {ambitos_str or '(todos)'}")
    print(f"  Consulta: {consulta_str or '(ninguna)'}")
    print("=" * 60)

    session = build_session()

    print("\nDescargando datos...")
    raw_results = scrape_all(session, niveles_str, ambitos_str, consulta_str)

    print(f"\nTotal bruto: {len(raw_results)}")

    normalized = [normalize_record(r) for r in raw_results]
    unique = deduplicate(normalized)
    print(f"Tras deduplicar: {len(unique)}")

    # Estadísticas rápidas
    con_nota = [r for r in unique if r["nota_corte"] is not None]
    sin_nota = len(unique) - len(con_nota)
    ccaas = sorted({r["ccaa"] for r in unique if r["ccaa"]})
    print(f"Con nota de corte: {len(con_nota)} | Sin nota: {sin_nota}")
    print(f"CCAA cubiertas ({len(ccaas)}): {', '.join(ccaas[:5])}{'...' if len(ccaas) > 5 else ''}")

    save(unique, nivel_key)
    print("\nCompletado.")


if __name__ == "__main__":
    main()
