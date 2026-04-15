"""
scraper_cursos_junta.py
=======================
Extrae cursos gratuitos de la Junta de Andalucía (FPE).
API: Drupal Views AJAX en /empleoformacionytrabajoautonomo/formacion/web/views/ajax

Uso:
    pip install requests beautifulsoup4
    python scraper_cursos_junta.py                     # todos
    python scraper_cursos_junta.py --tipo ocupados
    python scraper_cursos_junta.py --tipo desempleados
    python scraper_cursos_junta.py --continuar
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
OUTPUT_JSON   = "cursos_junta_andalucia.json"
BASE_URL      = "https://www.juntadeandalucia.es"
VIEWS_AJAX    = f"{BASE_URL}/empleoformacionytrabajoautonomo/formacion/web/views/ajax"
ITEMS_PER_PAGE = 24
DELAY_MIN     = 1.0
DELAY_MAX     = 2.5

HEADERS = {
    "User-Agent":        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
    "Accept":            "application/json, text/javascript, */*; q=0.01",
    "Accept-Language":   "es-ES,es;q=0.9",
    "X-Requested-With":  "XMLHttpRequest",
    "Referer":           f"{BASE_URL}/empleoformacionytrabajoautonomo/formacion/web/buscador-de-cursos",
}

TIPOS = {"ocupados": "o", "desempleados": "d"}
# ──────────────────────────────────────────────────────────────────────────────


def obtener_pagina(session, tipo_code, pagina=0):
    params = {
        "view_name":          "view_advanced_search_engine",
        "view_display_id":    "display_course_line",
        "view_args":          "",
        "view_path":          "/buscador-de-cursos",
        "view_base_path":     "buscador-de-cursos",
        "view_dom_id":        "vocaccion_scraper",
        "pager_element":      "0",
        "dirigido-a-personas": tipo_code,
        "financiacion":       "gratuita",
        "nombre":             "",
        "items_per_page":     ITEMS_PER_PAGE,
        "sort_bef_combine":   "nombre_ASC",
        "page":               pagina,
        "_drupal_ajax":       "1",
        "_wrapper_format":    "drupal_ajax",
    }
    resp = session.get(VIEWS_AJAX, params=params, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.json()


def parsear_cursos(data):
    """Extrae cursos del comando 'insert' de la respuesta Drupal AJAX."""
    cursos = []

    # Buscar el comando insert con los datos principales
    html_cursos = ""
    for cmd in data:
        if cmd.get("command") == "insert" and cmd.get("method") == "replaceWith":
            html_cursos = cmd.get("data", "")
            break

    if not html_cursos:
        return cursos

    soup = BeautifulSoup(html_cursos, "html.parser")
    items = soup.find_all("div", class_="views-view-grid__item-inner")

    for item in items:
        curso = {}

        # Familia profesional
        f = item.find("div", class_="views-field-field-professional-family")
        curso["familia"] = f.get_text(strip=True) if f else ""

        # Expediente
        exp = item.find("div", class_="views-field-field-number-folder")
        curso["expediente"] = exp.get_text(strip=True).replace("Exp.: ", "") if exp else ""

        # Código + denominación (extraídos del texto del enlace)
        titulo_div = item.find("div", class_="views-field-title-1")
        if titulo_div:
            enlace = titulo_div.find("a")
            if enlace:
                texto = enlace.get_text(strip=True)
                m = re.match(r"^([A-Z0-9]+)\s*[-–]\s*(.+)$", texto)
                if m:
                    curso["codigo"]       = m.group(1).strip()
                    curso["denominacion"] = m.group(2).strip()
                else:
                    curso["codigo"]       = ""
                    curso["denominacion"] = texto
                # ID y URL de detalle
                href = enlace.get("href", "")
                m_id = re.search(r"/(\d+)$", href)
                curso["id_curso"] = int(m_id.group(1)) if m_id else None
                curso["url"] = f"{BASE_URL}{href}" if href.startswith("/") else href

        # Dirigido a
        dir_div = item.find("div", class_="views-field-field-directed")
        curso["dirigido_a"] = dir_div.get_text(strip=True) if dir_div else ""

        # Modalidad
        mod = item.find("div", class_="views-field-field-impartation-modality")
        curso["modalidad"] = mod.get_text(strip=True) if mod else ""

        # Horario
        hor = item.find("div", class_="views-field-field-schedule")
        curso["horario"] = hor.get_text(strip=True) if hor else ""

        # Nivel de cualificación
        niv = item.find("div", class_="views-field-field-qualification-level")
        curso["nivel_cualificacion"] = niv.get_text(strip=True) if niv else ""

        # Tipo de curso
        tipo_c = item.find("div", class_="views-field-field-type-course")
        curso["tipo_curso"] = tipo_c.get_text(strip=True) if tipo_c else ""

        # Estado
        est = item.find("div", class_="views-field-field-state")
        curso["estado"] = est.get_text(strip=True) if est else ""

        # Fin de solicitud
        rng = item.find("div", class_="range-presentation")
        if rng:
            m_fecha = re.search(r"(\d{2}/\d{2}/\d{4})", rng.get_text())
            curso["fin_solicitud"] = m_fecha.group(1) if m_fecha else ""

        # Inicio previsto
        dr = item.find("div", class_="date-range")
        if dr:
            m_fecha = re.search(r"(\d{2}/\d{2}/\d{4})", dr.get_text())
            curso["inicio_previsto"] = m_fecha.group(1) if m_fecha else ""

        # Horas
        hrs = item.find("div", class_="hours")
        if hrs:
            m_h = re.search(r"(\d+)", hrs.get_text())
            curso["horas"] = int(m_h.group(1)) if m_h else None

        # Provincia (solo cursos presenciales)
        prov = item.find("div", class_="province")
        curso["provincia"] = prov.get_text(strip=True) if prov else ""

        if curso.get("denominacion") or curso.get("codigo"):
            cursos.append(curso)

    return cursos


def cargar_previos(path):
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        lista = json.load(f)
    return {str(item.get("id_curso", item.get("expediente", i))): item
            for i, item in enumerate(lista)}


def guardar(path, resultados):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(list(resultados.values()), f, ensure_ascii=False, indent=2)


def scrapear_tipo(session, tipo_nombre, tipo_code, resultados):
    print(f"\n📋 {tipo_nombre.upper()} — cursos gratuitos Junta de Andalucía")
    pagina = 0

    while True:
        print(f"  Pág {pagina}...", end=" ", flush=True)
        try:
            data    = obtener_pagina(session, tipo_code, pagina)
            cursos  = parsear_cursos(data)

            if not cursos:
                print("sin más cursos")
                break

            nuevos = 0
            for c in cursos:
                clave = str(c.get("id_curso") or c.get("expediente") or c.get("denominacion"))
                if clave not in resultados:
                    resultados[clave] = c
                    nuevos += 1

            print(f"{len(cursos)} cursos ({nuevos} nuevos) — acum: {len(resultados)}")

            if len(cursos) < ITEMS_PER_PAGE:
                break

            pagina += 1
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

        except Exception as e:
            print(f"⚠️  Error: {e}")
            break

    return resultados


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--tipo", choices=["ocupados", "desempleados", "todos"], default="todos")
    parser.add_argument("--continuar", action="store_true")
    args = parser.parse_args()

    resultados = cargar_previos(OUTPUT_JSON) if args.continuar else {}
    session    = requests.Session()

    tipos = TIPOS if args.tipo == "todos" else {args.tipo: TIPOS[args.tipo]}

    for nombre, code in tipos.items():
        resultados = scrapear_tipo(session, nombre, code, resultados)
        guardar(OUTPUT_JSON, resultados)
        print(f"  💾 Guardado: {len(resultados)} cursos en '{OUTPUT_JSON}'")

    print(f"\n✅ Total final: {len(resultados)} cursos")


if __name__ == "__main__":
    main()
