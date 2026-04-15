#!/usr/bin/env python3
"""
Scraper de detalle e inserción laboral por titulación — QEDU
Ministerio de Ciencia, Innovación y Universidades (España)

Endpoint: POST https://www.ciencia.gob.es/home/qedu/main/zona02/0
Actions:  detalle + detalleIn

Este script ENRIQUECE los datos de notas de corte ya descargados con:
  - Información detallada de la titulación (plazas, tasas, créditos, precio, etc.)
  - Datos de inserción laboral específicos para esa titulación y centro

Uso:
    python scrape_qedu_detalle.py                       # Procesa todo el dataset GRADO
    python scrape_qedu_detalle.py --nivel MASTER        # Solo másteres
    python scrape_qedu_detalle.py --nivel ALL           # Todos los niveles
    python scrape_qedu_detalle.py --sample 50           # Test con 50 registros
    python scrape_qedu_detalle.py --resume              # Continúa desde la última ejecución

Flujo:
    1. Descarga el dataset completo con action=tarjeta (misma llamada que scrape_qedu.py)
    2. Para cada registro único (codTit, codCentro, codUniv):
         a) action=detalle → info completa + campo 'ambito' (ISCED) y 'nivel'
         b) action=detalleIn → inserción laboral específica de esa titulación
    3. Guarda resultados incrementalmente (soporta interrupción y resume)

Salida:
    ../../database/data/catalog/qedu/detalle_<nivel>_<fecha>.json
    ../../database/data/catalog/qedu/detalle_<nivel>_latest.json
    ../../database/data/catalog/qedu/detalle_<nivel>_progress.json  (checkpoint)

Nota sobre rendimiento:
    Con ~3000 registros GRADO y 0.4s de delay entre calls, el proceso completo
    toma ~40 minutos. Usa --sample N para pruebas rápidas.
    Usa --resume para continuar una ejecución interrumpida.
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
DELAY_BETWEEN = 0.4    # segundos entre pares de requests (detalle + detalleIn)
MAX_RETRIES = 3
CHECKPOINT_EVERY = 50  # Guardar progreso cada N registros procesados

NIVELES_DISPONIBLES = {
    "GRADO":   "'GRADO'",
    "GRADOD":  "'GRADOD'",
    "MASTER":  "'MASTER'",
    "MASTERD": "'MASTERD'",
    "DOCTOR":  "'DOCTOR'",
    "ALL":     "'GRADO','GRADOD','MASTER','MASTERD','DOCTOR'",
}

# Niveles individuales que se procesan cuando se pasa ALL
NIVELES_ALL = ["GRADO", "GRADOD", "MASTER", "MASTERD", "DOCTOR"]

OUTPUT_DIR = (
    Path(__file__).parent.parent.parent.parent
    / "database" / "data" / "catalog" / "qedu"
)


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def build_session():
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
    """Decodifica la respuesta priorizando UTF-8."""
    try:
        return response.content.decode("utf-8")
    except UnicodeDecodeError:
        return response.content.decode("iso-8859-1")


def safe_post(session, payload: dict) -> dict | None:
    """POST con retry logic. Devuelve dict/list o None en fallo."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.post(QEDU_URL, data=payload, timeout=30)
            resp.raise_for_status()
            text = smart_decode(resp)
            if not text.strip() or text.strip() in ("null", ""):
                return None
            return json.loads(text)
        except requests.exceptions.RequestException as exc:
            if attempt < MAX_RETRIES:
                time.sleep(2 ** attempt)
            else:
                return None
        except json.JSONDecodeError:
            return None
    return None


# ---------------------------------------------------------------------------
# Fetching raw data from QEDU (action=tarjeta — igual que scrape_qedu.py)
# ---------------------------------------------------------------------------

def fetch_tarjeta(session, niveles_str: str) -> list:
    """Descarga todos los registros de tarjeta para los niveles dados."""
    payload = {
        "action": "tarjeta",
        "offset": 0,
        "consulta": "",
        "niveles": niveles_str,
        "ambitos": "",
    }
    print("  Descargando dataset tarjeta...", end=" ", flush=True)
    data = safe_post(session, payload)
    if isinstance(data, list):
        print(f"{len(data)} registros")
        return data
    print("ERROR: no se recibieron datos")
    return []


# ---------------------------------------------------------------------------
# Per-record enrichment
# ---------------------------------------------------------------------------

def fetch_detalle(session, cod_tit: str, cod_centro: str, cod_univ: str) -> dict | None:
    """Llama a action=detalle para una titulación específica."""
    return safe_post(session, {
        "action": "detalle",
        "codTit": cod_tit,
        "codCentro": cod_centro,
        "codUniv": cod_univ,
    })


def fetch_insercion(
    session,
    cod_tit: str,
    cod_centro: str,
    cod_univ: str,
    nivel: str,
    ambito: str,
) -> dict | None:
    """Llama a action=detalleIn para obtener datos de inserción laboral."""
    return safe_post(session, {
        "action": "detalleIn",
        "codTit": cod_tit,
        "codCentro": cod_centro,
        "codUniv": cod_univ,
        "nivel": nivel,
        "ambito": ambito,
    })


# ---------------------------------------------------------------------------
# Normalización
# ---------------------------------------------------------------------------

def parse_float(value) -> float | None:
    if not value or str(value) in ("N/D", "", "0", 0):
        return None
    cleaned = str(value).replace("\xa0", "").replace(" ", "").replace(",", ".")
    # Eliminar símbolo € y variantes mal codificadas
    for sym in ["€", "â¬", "â€¬"]:
        cleaned = cleaned.replace(sym, "")
    cleaned = cleaned.strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def normalize_record(raw_tarjeta: dict, raw_detalle: dict | None, raw_insercion: dict | None) -> dict:
    """Combina los tres endpoints en un único registro normalizado."""

    # -- Base desde tarjeta --
    record = {
        "cod_titulacion":    raw_tarjeta.get("codTitula"),
        "cod_centro":        raw_tarjeta.get("codCentro"),
        "cod_universidad":   raw_tarjeta.get("codUniv"),
        "titulacion":        raw_tarjeta.get("titulacion", "").strip(),
        "nivel":             raw_tarjeta.get("nivel"),
        "tipo_universidad":  raw_tarjeta.get("tipoUniversidad"),
        "tipo_centro":       raw_tarjeta.get("tipoCentro"),
        "nombre_centro":     raw_tarjeta.get("nombreCentro", "").strip(),
        "nombre_universidad": raw_tarjeta.get("nombreUniversidad", "").strip(),
        "ccaa":              raw_tarjeta.get("ccaa", "").strip(),
        "provincia":         raw_tarjeta.get("provincia", "").strip(),
        "cod_provincia":     raw_tarjeta.get("codProvi"),
        "modalidad":         raw_tarjeta.get("modalidad"),
        "idioma_extranjero": raw_tarjeta.get("idiomaextranjero") == "1",
        "nota_corte":        parse_float(raw_tarjeta.get("notaCorte")),
        "anio":              raw_tarjeta.get("anio"),
        # Campos de detalle (rellenar si disponible)
        "ambito_isced":      None,
        "plazas":            None,
        "tasa_afiliacion_centro": None,
        "creditos":          None,
        "precio_credito":    None,
        "nota_corte_anterior": None,
        "nota_admision_media": None,
        "anio_actual":       None,
        "anio_anterior":     None,
        "enlace":            None,
        # Campos de inserción laboral (rellenar si disponible)
        "insercion_tasa_afiliacion":  None,
        "insercion_pct_autonomos":    None,
        "insercion_pct_indefinidos":  None,
        "insercion_pct_cotizacion":   None,
        "insercion_salario_medio":    None,
    }

    # -- Enriquecer con detalle --
    if raw_detalle:
        record.update({
            "ambito_isced":      raw_detalle.get("ambito"),
            "plazas":            raw_detalle.get("plazas"),
            "tasa_afiliacion_centro": parse_float(raw_detalle.get("tasas")),
            "creditos":          raw_detalle.get("creditos"),
            "precio_credito":    raw_detalle.get("precio", "").replace("€", "").replace("â¬", "").strip() or None,
            "nota_corte_anterior": parse_float(raw_detalle.get("notaCorteAnt")),
            "nota_admision_media": parse_float(raw_detalle.get("notaAdmision")),
            "anio_actual":       raw_detalle.get("anioActual"),
            "anio_anterior":     raw_detalle.get("anioAnterior"),
            "enlace":            raw_detalle.get("enlace"),
            # Refinar nivel si tarjeta lo trae vacío
            "nivel":             raw_detalle.get("nivel") or record["nivel"],
        })

    # -- Enriquecer con inserción laboral --
    if raw_insercion:
        record.update({
            "insercion_tasa_afiliacion": parse_float(
                str(raw_insercion.get("tasaAfiliacion", "")).replace("%", "")
            ),
            "insercion_pct_autonomos":   parse_float(
                str(raw_insercion.get("porcentajeAutonomos", "")).replace("%", "")
            ),
            "insercion_pct_indefinidos": parse_float(
                str(raw_insercion.get("porcentajeIndefinidos", "")).replace("%", "")
            ),
            "insercion_pct_cotizacion":  parse_float(
                str(raw_insercion.get("porcentajeCotizacion", "")).replace("%", "")
            ),
            "insercion_salario_medio":   parse_float(
                str(raw_insercion.get("baseMedia", ""))
                .replace("€", "").replace("â¬", "").replace(" ", "")
            ),
        })

    return record


# ---------------------------------------------------------------------------
# Checkpoint (save/load)
# ---------------------------------------------------------------------------

def load_checkpoint(nivel_key: str) -> set:
    """Carga el conjunto de claves ya procesadas desde el checkpoint."""
    path = OUTPUT_DIR / f"detalle_{nivel_key.lower()}_progress.json"
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            keys = {tuple(k) for k in data.get("processed_keys", [])}
            print(f"  [Resume] {len(keys)} registros ya procesados")
            return keys
        except Exception:
            pass
    return set()


def save_checkpoint(nivel_key: str, processed_keys: set, results: list):
    """Guarda el checkpoint de progreso."""
    path = OUTPUT_DIR / f"detalle_{nivel_key.lower()}_progress.json"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "processed_count": len(processed_keys),
                "processed_keys": [list(k) for k in processed_keys],
                "results_count": len(results),
            },
            f,
            ensure_ascii=False,
        )


def delete_checkpoint(nivel_key: str):
    """Elimina el checkpoint tras completar exitosamente."""
    path = OUTPUT_DIR / f"detalle_{nivel_key.lower()}_progress.json"
    if path.exists():
        path.unlink()


# ---------------------------------------------------------------------------
# Core scraping
# ---------------------------------------------------------------------------

def scrape(session, nivel_key: str, sample: int | None, resume: bool) -> list:
    """Descarga y enriquece todos los registros para un nivel dado."""
    niveles_str = NIVELES_DISPONIBLES[nivel_key]

    # 1. Obtener el dataset completo con tarjeta
    print(f"\nPaso 1: Descargando listado tarjeta para nivel {nivel_key}...")
    raw_records = fetch_tarjeta(session, niveles_str)
    if not raw_records:
        return []

    # Deduplicar por (codTit, codCentro, codUniv)
    seen_keys = set()
    unique_records = []
    for r in raw_records:
        key = (r.get("codTitula"), r.get("codCentro"), r.get("codUniv"))
        if key not in seen_keys:
            seen_keys.add(key)
            unique_records.append(r)
    print(f"  Registros únicos: {len(unique_records)}")

    # Aplicar muestra
    if sample:
        unique_records = unique_records[:sample]
        print(f"  [Sample] Limitado a {sample} registros para prueba")

    # 2. Cargar checkpoint si --resume
    processed_keys = load_checkpoint(nivel_key) if resume else set()

    # Cargar resultados parciales existentes si hay checkpoint
    results = []
    if resume and processed_keys:
        partial_path = OUTPUT_DIR / f"detalle_{nivel_key.lower()}_partial.json"
        if partial_path.exists():
            with open(partial_path, "r", encoding="utf-8") as f:
                results = json.load(f)
            print(f"  [Resume] {len(results)} resultados parciales cargados")

    # 3. Procesar cada registro
    total = len(unique_records)
    skipped = 0
    failed_detalle = 0
    failed_insercion = 0

    print(f"\nPaso 2: Enriqueciendo {total} registros (detalle + detalleIn)...")
    print(f"  Progreso guardado cada {CHECKPOINT_EVERY} registros")
    print()

    for i, raw in enumerate(unique_records, 1):
        key = (raw.get("codTitula"), raw.get("codCentro"), raw.get("codUniv"))

        # Saltar si ya procesado (resume)
        if key in processed_keys:
            skipped += 1
            continue

        titulacion_short = raw.get("titulacion", "")[:45]
        print(f"  [{i:4d}/{total}] {titulacion_short:<45}", end=" ", flush=True)

        # a) action=detalle
        raw_detalle = fetch_detalle(session, key[0], key[1], key[2])
        if raw_detalle is None:
            failed_detalle += 1
            print("FAIL detalle")
        else:
            # b) action=detalleIn (requiere ambito y nivel de detalle)
            ambito = raw_detalle.get("ambito", "")
            nivel_dto = raw_detalle.get("nivel", "")
            raw_insercion = None
            if ambito and nivel_dto:
                raw_insercion = fetch_insercion(
                    session, key[0], key[1], key[2], nivel_dto, ambito
                )
                if raw_insercion is None:
                    failed_insercion += 1

            # Normalizar y añadir al resultado
            record = normalize_record(raw, raw_detalle, raw_insercion)
            results.append(record)

            # Log compacto
            ins_info = ""
            if raw_insercion:
                ta = raw_insercion.get("tasaAfiliacion", "?")
                sm = raw_insercion.get("baseMedia", "?")
                ins_info = f" | empleo={ta} sal={sm}"
            print(f"OK{ins_info}")

        processed_keys.add(key)

        # Checkpoint periódico
        if len(processed_keys) % CHECKPOINT_EVERY == 0:
            save_checkpoint(nivel_key, processed_keys, results)
            # Guardar resultados parciales
            partial_path = OUTPUT_DIR / f"detalle_{nivel_key.lower()}_partial.json"
            with open(partial_path, "w", encoding="utf-8") as f:
                json.dump(results, f, ensure_ascii=False)
            print(f"    [Checkpoint] {len(processed_keys)} procesados, {len(results)} guardados")

        time.sleep(DELAY_BETWEEN)

    print(f"\n  Completado: {len(results)} registros enriquecidos")
    print(f"  Omitidos (resume): {skipped} | Falló detalle: {failed_detalle} | Sin inserción: {failed_insercion}")
    return results


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def save(records: list, nivel_key: str):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    today = date.today().isoformat()
    filename = f"detalle_{nivel_key.lower()}_{today}.json"
    filepath = OUTPUT_DIR / filename

    con_insercion = sum(1 for r in records if r.get("insercion_tasa_afiliacion") is not None)
    con_ambito = sum(1 for r in records if r.get("ambito_isced") is not None)

    payload = {
        "fuente": "QEDU — Ministerio de Ciencia, Innovación y Universidades",
        "url": "https://www.ciencia.gob.es/qedu.html",
        "endpoints_usados": ["tarjeta", "detalle", "detalleIn"],
        "fecha_extraccion": today,
        "nivel": nivel_key,
        "total": len(records),
        "con_datos_insercion": con_insercion,
        "con_ambito_isced": con_ambito,
        "nota": "Inserción laboral medida 4 años después de finalizar los estudios",
        "campos": {
            # Básicos (tarjeta)
            "cod_titulacion": "Código único de la titulación",
            "cod_centro": "Código del centro universitario",
            "cod_universidad": "Código de la universidad",
            "titulacion": "Nombre oficial de la titulación",
            "nivel": "GRADO / GRADOD / MASTER / MASTERD / DOCTOR",
            "nombre_centro": "Nombre del centro donde se imparte",
            "nombre_universidad": "Nombre de la universidad",
            "ccaa": "Comunidad Autónoma del centro",
            "provincia": "Provincia del centro",
            "modalidad": "Presencial / Online / Semipresencial",
            "idioma_extranjero": "Si la titulación tiene idioma extranjero",
            "nota_corte": "Nota de corte del curso más reciente",
            "anio": "Año académico de la nota de corte",
            # De detalle
            "ambito_isced": "Código ISCED del sector de la titulación",
            "plazas": "Número de plazas ofertadas",
            "tasa_afiliacion_centro": "Tasa de afiliación del centro (%)",
            "creditos": "Número de créditos ECTS",
            "precio_credito": "Precio por crédito en €",
            "nota_corte_anterior": "Nota de corte del año anterior",
            "nota_admision_media": "Nota media de admisión",
            "anio_actual": "Curso actual (ej: 2025-2026)",
            "anio_anterior": "Curso anterior (ej: 2024-2025)",
            "enlace": "URL oficial de la titulación",
            # De detalleIn
            "insercion_tasa_afiliacion": "% de titulados empleados (SS) 4 años después",
            "insercion_pct_autonomos": "% de autónomos",
            "insercion_pct_indefinidos": "% con contrato indefinido",
            "insercion_pct_cotizacion": "% cotizando a la Seguridad Social",
            "insercion_salario_medio": "Salario bruto medio anual (€)",
        },
        "datos": records,
    }

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    latest_path = OUTPUT_DIR / f"detalle_{nivel_key.lower()}_latest.json"
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"\nGuardado: {filepath}")
    print(f"Latest:   {latest_path}")
    return filepath


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    global DELAY_BETWEEN

    parser = argparse.ArgumentParser(
        description="Scraper de detalle e inserción laboral por titulación — QEDU"
    )
    parser.add_argument(
        "--nivel",
        default="GRADO",
        choices=list(NIVELES_DISPONIBLES.keys()),
        help="Nivel de titulación (default: GRADO)",
    )
    parser.add_argument(
        "--sample",
        type=int,
        default=None,
        metavar="N",
        help="Limitar a N registros para prueba (default: todos)",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Continuar desde el último checkpoint guardado",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=DELAY_BETWEEN,
        metavar="SECS",
        help=f"Segundos entre requests (default: {DELAY_BETWEEN})",
    )
    args = parser.parse_args()

    DELAY_BETWEEN = args.delay

    # Determinar qué niveles procesar
    niveles_a_procesar = NIVELES_ALL if args.nivel == "ALL" else [args.nivel]

    counts = {"GRADO": 3962, "GRADOD": 1524, "MASTER": 5354, "MASTERD": 207, "DOCTOR": 1679}
    total_est = sum(counts.get(n, 1000) for n in niveles_a_procesar)

    print("=" * 65)
    print("  QEDU — Detalle e insercion laboral por titulacion (Espana)")
    print(f"  Niveles:  {', '.join(niveles_a_procesar)}")
    print(f"  Sample:   {args.sample or '(todos)'}")
    print(f"  Resume:   {'si' if args.resume else 'no'}")
    print(f"  Delay:    {DELAY_BETWEEN}s entre requests")
    if not args.sample:
        mins_est = round(total_est * DELAY_BETWEEN / 60)
        print(f"  Registros estimados: ~{total_est} | Tiempo: ~{mins_est} min")
    print("=" * 65)

    session = build_session()

    for nivel_key in niveles_a_procesar:
        print(f"\n{'='*65}")
        print(f"  Procesando nivel: {nivel_key}")
        print(f"{'='*65}")
        results = scrape(session, nivel_key, args.sample, args.resume)
        if results:
            save(results, nivel_key)
            if not args.resume:
                delete_checkpoint(nivel_key)
            print(f"  [{nivel_key}] Completado: {len(results)} registros guardados.")
        else:
            print(f"  [{nivel_key}] Sin resultados.")

    print("\nTodos los niveles completados.")


if __name__ == "__main__":
    main()
