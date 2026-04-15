#!/usr/bin/env python3
"""
RUCT / SIIU source probe for VocAcción.

Objetivo:
- Detectar fuentes oficiales reutilizables para universidades, centros y títulos.
- Exportar el listado oficial de universidades disponible en RUCT.
- Dejar una base técnica para una futura ingesta masiva controlada.

Uso:
  python scripts/ruct_source_probe.py --export-universities
  python scripts/ruct_source_probe.py --write-inventory
"""

from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path
from typing import Any

import requests


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "database" / "data"

RUCT_BASE = "https://www.educacion.gob.es/ruct"
RUCT_UNIVERSITIES_URL = f"{RUCT_BASE}/consultauniversidades?actual=universidades"
RUCT_CENTERS_URL = f"{RUCT_BASE}/consultacentros?actual=centros"
RUCT_STUDIES_URL = f"{RUCT_BASE}/consultaestudios?actual=estudios"


def clean_text(value: str) -> str:
    value = html.unescape(value)
    value = value.replace("\xa0", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def fetch(url: str, session: requests.Session | None = None) -> str:
    client = session or requests.Session()
    response = client.get(url, timeout=60)
    response.raise_for_status()

    # RUCT declara iso-8859-15 en HTML; requests no siempre lo ajusta solo.
    response.encoding = response.encoding or "iso-8859-15"
    return response.text


def parse_select_options(page_html: str, select_name: str) -> list[dict[str, str]]:
    select_match = re.search(
        rf'<select[^>]*name="{re.escape(select_name)}"[^>]*>(.*?)</select>',
        page_html,
        re.S | re.I,
    )
    if not select_match:
        return []

    options_html = select_match.group(1)
    items: list[dict[str, str]] = []

    for value, label in re.findall(r'<option value="([^"]*)"[^>]*>(.*?)</option>', options_html, re.S | re.I):
        code = clean_text(value)
        name = clean_text(label)
        if not code or name.lower() == "todos":
            continue
        items.append({"code": code, "name": name})

    return items


def export_universities() -> Path:
    html_text = fetch(RUCT_UNIVERSITIES_URL)
    universities = parse_select_options(html_text, "codigoUniversidad")
    autonomy_options = parse_select_options(html_text, "cccaa")

    output = {
        "source": "RUCT",
        "source_url": RUCT_UNIVERSITIES_URL,
        "encoding": "iso-8859-15",
        "retrieved_at_note": "Regenerate this file to refresh from source.",
        "total_universities": len(universities),
        "total_autonomies": len(autonomy_options),
        "universities": universities,
        "autonomies": autonomy_options,
    }

    out_path = DATA_DIR / "ruct_universities.json"
    out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_path


def build_inventory() -> dict[str, Any]:
    return {
        "preferred_strategy": {
            "primary_source": "SIIU / estadísticas oficiales exportables (XLSX, CSV, PX)",
            "secondary_source": "RUCT HTML para registro vivo y detalle canónico de universidad/centro/título",
            "why": [
                "SIIU tiene mejor encaje legal para reutilización masiva.",
                "RUCT ofrece el estado registral y los detalles oficiales navegables.",
                "QEDU parece apoyarse principalmente en SIIU según el aviso legal oficial.",
            ],
        },
        "ruct": {
            "home": RUCT_BASE + "/home",
            "universities_search": RUCT_UNIVERSITIES_URL,
            "centers_search": RUCT_CENTERS_URL,
            "studies_search": RUCT_STUDIES_URL,
            "detail_patterns": {
                "university": RUCT_BASE + "/universidad.action?codigoUniversidad={codigo}&actual=universidades",
                "center": RUCT_BASE + "/centro.action?codigoUniversidad={codigo_universidad}&codigoCentro={codigo_centro}&actual=centros",
                "study": RUCT_BASE + "/estudio.action?codigoCiclo={codigo_ciclo}&codigoTipo={codigo_tipo}&CodigoEstudio={codigo_estudio}&actual=estudios",
                "study_request_detail": RUCT_BASE + "/solicitud/detalles.action?cod={codigo_solicitud}&sit={situacion}&actual=menu.solicitud.basicos",
            },
            "notes": [
                "RUCT usa HTML server-rendered con Struts, no API pública JSON documentada.",
                "Los enlaces pueden incluir ;jsessionid=..., pero se puede ignorar para persistencia local.",
                "La codificación del HTML es iso-8859-15.",
            ],
        },
        "siiu_exports": {
            "landing": "https://www.ciencia.gob.es/Ministerio/Estadisticas/SIIU.html",
            "uct": "https://www.ciencia.gob.es/Ministerio/Estadisticas/SIIU/UCT.html",
            "examples": [
                {
                    "name": "Titulaciones de Grado por rama y universidad",
                    "format": ["XLSX", "CSV", "PX"],
                    "url_xlsx": "https://estadisticas.ciencia.gob.es/jaxiPx/files/_px/es/xlsx/Universitaria/EUCT/2024/Titulaciones/l0/Titulaciones_Grado_Rama_Univ.xlsx?nocab=1",
                    "url_csv_sc": "https://estadisticas.ciencia.gob.es/jaxiPx/files/_px/es/csv_sc/Universitaria/EUCT/2024/Titulaciones/l0/Titulaciones_Grado_Rama_Univ.csv_sc?nocab=1",
                    "url_px": "https://estadisticas.ciencia.gob.es/jaxiPx/files/_px/es/px/Universitaria/EUCT/2024/Titulaciones/l0/Titulaciones_Grado_Rama_Univ.px?nocab=1",
                },
                {
                    "name": "Preinscripción por titulación",
                    "format": ["XLSX"],
                    "url_xlsx": "https://www.ciencia.gob.es/dam/jcr:002463cb-6984-4286-9252-649a69c3863f/PreinscripcionEUCT-2024.xlsx",
                },
                {
                    "name": "Matriculados por titulación",
                    "format": ["XLSX"],
                    "url_xlsx": "https://www.ciencia.gob.es/dam/jcr:717ab000-0372-44e4-bec3-e49afcb2838b/MatriculadosTitulacion2015_2024.xlsx",
                },
                {
                    "name": "Egresados por titulación",
                    "format": ["XLSX"],
                    "url_xlsx": "https://www.ciencia.gob.es/dam/jcr:decc2024-82d0-4063-9202-9be6885bd34a/EgresadosTitulacion2015_2023.xlsx",
                },
            ],
        },
        "legal": {
            "general_legal_notice": "https://www.ciencia.gob.es/InfoGeneralPortal/AvisoLegal.html",
            "reuse_conditions": "https://www.ciencia.gob.es/Ministerio/Estadisticas/ReutilizacionDatos.html",
            "dataset_request": "https://www.ciencia.gob.es/Ministerio/Estadisticas/SolicitudDatos.html",
            "summary": [
                "Para datasets/estadísticas oficiales, la reutilización está permitida con cita de fuente y sin desnaturalizar la información.",
                "Para scraping HTML del portal general, el encaje legal es más débil; conviene usarlo solo como complemento o último recurso.",
            ],
        },
        "integration_recommendation": {
            "phase_1": "Crear tablas locales para universidades, centros y títulos oficiales usando RUCT como registro canónico.",
            "phase_2": "Añadir métricas SIIU (matrícula, egresados, preinscripción, empleabilidad) por título/universidad.",
            "phase_3": "Cruzar CareerCatalog/itinerarios con campos de estudio y ramas oficiales para recomendaciones más precisas.",
        },
    }


def write_inventory() -> Path:
    out_path = DATA_DIR / "ruct_siiu_source_inventory.json"
    out_path.write_text(json.dumps(build_inventory(), ensure_ascii=False, indent=2), encoding="utf-8")
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(description="RUCT/SIIU probe and export utility")
    parser.add_argument("--export-universities", action="store_true", help="Export universities select list from RUCT")
    parser.add_argument("--write-inventory", action="store_true", help="Write source inventory JSON with official URLs and strategy")
    args = parser.parse_args()

    if not args.export_universities and not args.write_inventory:
        parser.error("Use at least one option: --export-universities or --write-inventory")

    if args.export_universities:
        path = export_universities()
        print(f"Universities exported to: {path}")

    if args.write_inventory:
        path = write_inventory()
        print(f"Source inventory written to: {path}")


if __name__ == "__main__":
    main()
