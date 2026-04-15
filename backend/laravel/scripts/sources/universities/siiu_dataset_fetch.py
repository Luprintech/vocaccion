#!/usr/bin/env python3
"""
Descarga datasets oficiales SIIU definidos en ruct_siiu_source_inventory.json.

Ejemplos:
  python scripts/siiu_dataset_fetch.py --list
  python scripts/siiu_dataset_fetch.py --dataset grado_rama_univ_csv
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import requests


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "database" / "data"
RAW_DIR = DATA_DIR / "siiu_raw"

INVENTORY_PATH = DATA_DIR / "ruct_siiu_source_inventory.json"

DATASETS = {
    "grado_rama_univ_csv": {
        "url": "https://estadisticas.ciencia.gob.es/jaxiPx/files/_px/es/csv_sc/Universitaria/EUCT/2024/Titulaciones/l0/Titulaciones_Grado_Rama_Univ.csv_sc?nocab=1",
        "filename": "Titulaciones_Grado_Rama_Univ_2024.csv",
    },
    "grado_rama_univ_xlsx": {
        "url": "https://estadisticas.ciencia.gob.es/jaxiPx/files/_px/es/xlsx/Universitaria/EUCT/2024/Titulaciones/l0/Titulaciones_Grado_Rama_Univ.xlsx?nocab=1",
        "filename": "Titulaciones_Grado_Rama_Univ_2024.xlsx",
    },
    "preinscripcion_2024_xlsx": {
        "url": "https://www.ciencia.gob.es/dam/jcr:002463cb-6984-4286-9252-649a69c3863f/PreinscripcionEUCT-2024.xlsx",
        "filename": "PreinscripcionEUCT_2024.xlsx",
    },
    "matriculados_2015_2024_xlsx": {
        "url": "https://www.ciencia.gob.es/dam/jcr:717ab000-0372-44e4-bec3-e49afcb2838b/MatriculadosTitulacion2015_2024.xlsx",
        "filename": "MatriculadosTitulacion2015_2024.xlsx",
    },
    "egresados_2015_2023_xlsx": {
        "url": "https://www.ciencia.gob.es/dam/jcr:decc2024-82d0-4063-9202-9be6885bd34a/EgresadosTitulacion2015_2023.xlsx",
        "filename": "EgresadosTitulacion2015_2023.xlsx",
    },
}


def list_datasets() -> None:
    print("Datasets SIIU disponibles:")
    for key, value in DATASETS.items():
        print(f"- {key}: {value['url']}")


def fetch_dataset(key: str) -> Path:
    if key not in DATASETS:
        raise SystemExit(f"Dataset desconocido: {key}")

    RAW_DIR.mkdir(parents=True, exist_ok=True)

    meta = DATASETS[key]
    response = requests.get(meta["url"], timeout=120)
    response.raise_for_status()

    out_path = RAW_DIR / meta["filename"]
    out_path.write_bytes(response.content)
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Download official SIIU datasets for VocAcción")
    parser.add_argument("--list", action="store_true", help="List supported datasets")
    parser.add_argument("--dataset", type=str, help="Dataset key to download")
    args = parser.parse_args()

    if args.list:
        list_datasets()
        return

    if args.dataset:
        path = fetch_dataset(args.dataset)
        print(f"Downloaded dataset to: {path}")
        return

    parser.error("Use --list or --dataset <key>")


if __name__ == "__main__":
    main()
