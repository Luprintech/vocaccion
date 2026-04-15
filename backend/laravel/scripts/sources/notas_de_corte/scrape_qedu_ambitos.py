#!/usr/bin/env python3
"""
Scraper de datos de inserción laboral por sector (ámbito ISCED) — QEDU
Ministerio de Ciencia, Innovación y Universidades (España)

Endpoint: POST https://www.ciencia.gob.es/home/qedu/main/zona02/0
Action:   detalleAmb

Uso:
    python scrape_qedu_ambitos.py              # Todos los ámbitos, Grado y Máster
    python scrape_qedu_ambitos.py --nivel G    # Solo grados
    python scrape_qedu_ambitos.py --nivel M    # Solo másteres

Salida:
    ../../database/data/catalog/qedu/insercion_ambitos_<nivel>_<fecha>.json
    ../../database/data/catalog/qedu/insercion_ambitos_latest.json

Campos devueltos por detalleAmb:
    - tasaAfiliacion:        % de titulados empleados
    - porcentajeAutonomos:   % de autónomos
    - porcentajeCotizacion:  % cotizando a la Seguridad Social
    - baseMedia:             salario bruto medio (€/año)
    - sexo:                  "Hombre", "Mujer", "Ambos sexos"
    - ambito:                nombre del sector
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
DELAY_BETWEEN = 0.4   # segundos entre requests (respetar al servidor)
MAX_RETRIES = 3

# Todos los códigos ISCED disponibles en el filtro QEDU
AMBITOS_ISCED = {
    # Educación
    143: "Formación de docentes de educación infantil",
    144: "Formación de docentes de enseñanza primaria",
    149: "Educación (otros)",
    109: "Educación (genérico)",
    # Artes y humanidades
    213: "Bellas Artes",
    219: "Artes (otras)",
    228: "Humanidades interdisciplinares",
    229: "Humanidades (otras)",
    209: "Artes y humanidades (genérico)",
    # Ciencias sociales, periodismo, información
    311: "Psicología",
    314: "Sociología y estudios culturales",
    319: "Ciencias sociales (otras)",
    320: "Periodismo e información",
    345: "Administración y dirección de empresas",
    349: "Negocios (otros)",
    380: "Derecho",
    309: "Ciencias sociales (genérico)",
    # Ciencias, matemáticas e informática
    420: "Ciencias biológicas y bioquímica",
    440: "Ciencias físicas, químicas y geológicas",
    460: "Matemáticas y estadística",
    409: "Ciencias (genérico)",
    480: "Informática",
    # Ingeniería
    509: "Ingeniería y profesiones afines",
    580: "Arquitectura y construcción",
    # Agricultura y veterinaria
    620: "Agricultura, silvicultura y pesca",
    640: "Veterinaria",
    609: "Agricultura (genérico)",
    # Salud y servicios sociales
    720: "Medicina",
    721: "Medicina (especialidades clínicas)",
    723: "Enfermería y cuidados",
    724: "Ciencias médicas y de diagnóstico",
    725: "Farmacia",
    726: "Terapia y rehabilitación",
    729: "Salud (otras)",
    # Servicios
    811: "Hostelería y turismo",
    813: "Deportes",
    814: "Trabajo social y orientación",
    815: "Servicios de transporte",
    816: "Medio ambiente",
    817: "Seguridad",
    819: "Servicios (otros)",
}

# Mapping nivel web → clave para la API
NIVEL_MAP = {
    "G": "G",   # Grado
    "M": "M",   # Máster
}

OUTPUT_DIR = (
    Path(__file__).parent.parent.parent.parent
    / "database" / "data" / "catalog" / "qedu"
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def build_session():
    """Crea sesión HTTP que imita al navegador."""
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


def smart_decode(response) -> str:
    """Intenta decodificar la respuesta en UTF-8, con fallback a iso-8859-1."""
    try:
        return response.content.decode("utf-8")
    except UnicodeDecodeError:
        return response.content.decode("iso-8859-1")


def parse_float(value: str):
    """Convierte string tipo '94,92' o '44 526,31' a float."""
    if not value or value in ("N/D", ""):
        return None
    cleaned = value.replace("\xa0", "").replace(" ", "").replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def fetch_ambito(session, cod_ambito: int, nivel: str) -> list:
    """Llama a detalleAmb para un sector y nivel dados.

    Devuelve lista de dicts con datos de empleo por sexo,
    o lista vacía si no hay datos.
    """
    payload = {
        "action": "detalleAmb",
        "ambito": str(cod_ambito),
        "nivel": nivel,
    }
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.post(QEDU_URL, data=payload, timeout=30)
            resp.raise_for_status()
            text = smart_decode(resp)
            if not text.strip() or text.strip() == "null":
                return []
            data = json.loads(text)
            return data if isinstance(data, list) else []
        except requests.exceptions.RequestException as exc:
            print(f"    [!] Intento {attempt}/{MAX_RETRIES}: {exc}", file=sys.stderr)
            if attempt < MAX_RETRIES:
                time.sleep(2 ** attempt)
        except json.JSONDecodeError:
            return []
    return []


def normalize_ambito_record(row: dict, cod_ambito: int, nivel: str) -> dict:
    """Normaliza un registro de inserción laboral por sector."""
    return {
        "cod_ambito":            cod_ambito,
        "nombre_ambito":         AMBITOS_ISCED.get(cod_ambito, row.get("ambito", "")),
        "nombre_ambito_qedu":    row.get("ambito", ""),
        "nivel":                 nivel,
        "sexo":                  row.get("sexo", "Ambos sexos"),
        "tasa_afiliacion":       parse_float(row.get("tasaAfiliacion", "")),
        "pct_autonomos":         parse_float(row.get("porcentajeAutonomos", "")),
        "pct_cotizacion":        parse_float(row.get("porcentajeCotizacion", "")),
        "salario_medio_anual":   parse_float(
            row.get("baseMedia", "").replace("€", "").replace("â¬", "").strip()
        ),
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def scrape_nivel(session, nivel: str) -> list:
    """Descarga datos de inserción para todos los ámbitos en un nivel dado."""
    results = []
    total = len(AMBITOS_ISCED)
    print(f"\nNivel {nivel} — {total} ámbitos ISCED")

    for i, (cod, nombre) in enumerate(AMBITOS_ISCED.items(), 1):
        print(f"  [{i:2d}/{total}] Ámbito {cod} ({nombre[:40]})...", end=" ", flush=True)
        rows = fetch_ambito(session, cod, nivel)

        if rows:
            normalized = [normalize_ambito_record(r, cod, nivel) for r in rows]
            results.extend(normalized)
            # Muestra datos de "Ambos sexos"
            ambos = next((r for r in normalized if "ambos" in r["sexo"].lower()), None)
            if ambos:
                ta = ambos["tasa_afiliacion"]
                sm = ambos["salario_medio_anual"]
                print(f"empleo={ta}% | salario={sm}€")
            else:
                print(f"{len(rows)} registros")
        else:
            print("sin datos")

        time.sleep(DELAY_BETWEEN)

    return results


def save(records: list, nivel_key: str):
    """Guarda los resultados en JSON."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    today = date.today().isoformat()
    filename = f"insercion_ambitos_{nivel_key.lower()}_{today}.json"
    filepath = OUTPUT_DIR / filename

    payload = {
        "fuente": "QEDU — Ministerio de Ciencia, Innovación y Universidades",
        "url": "https://www.ciencia.gob.es/qedu.html",
        "endpoint": "detalleAmb",
        "fecha_extraccion": today,
        "nivel": nivel_key,
        "total_sectores": len({r["cod_ambito"] for r in records}),
        "total_registros": len(records),
        "nota": "Datos de inserción laboral 4 años después de finalizar los estudios",
        "campos": {
            "tasa_afiliacion": "% de titulados dados de alta en la Seguridad Social",
            "pct_autonomos": "% de titulados trabajando como autónomos",
            "pct_cotizacion": "% de titulados cotizando a la SS (empleados reales)",
            "salario_medio_anual": "Base de cotización media anual en €",
        },
        "datos": records,
    }

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    # Copia como "latest"
    latest_path = OUTPUT_DIR / f"insercion_ambitos_{nivel_key.lower()}_latest.json"
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"\nGuardado: {filepath}")
    print(f"Latest:   {latest_path}")
    return filepath


def main():
    parser = argparse.ArgumentParser(
        description="Scraper de inserción laboral por sector ISCED — QEDU (Ministerio Ciencia)"
    )
    parser.add_argument(
        "--nivel",
        default="AMBOS",
        choices=["G", "M", "AMBOS"],
        help="Nivel: G=Grado, M=Máster, AMBOS=ambos (default: AMBOS)",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("  QEDU — Inserción laboral por sector (España)")
    print(f"  Nivel: {args.nivel}")
    print(f"  Ámbitos ISCED: {len(AMBITOS_ISCED)}")
    print("=" * 60)

    session = build_session()
    niveles = ["G", "M"] if args.nivel == "AMBOS" else [args.nivel]

    for nivel in niveles:
        records = scrape_nivel(session, nivel)
        if records:
            save(records, nivel)
            sectores_con_datos = len({r["cod_ambito"] for r in records})
            print(f"\nTotal nivel {nivel}: {len(records)} registros ({sectores_con_datos} sectores con datos)")
        else:
            print(f"\nNivel {nivel}: sin datos")

    print("\nCompletado.")


if __name__ == "__main__":
    main()
