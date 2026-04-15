#!/usr/bin/env python3
"""
Genera datasets PHP desde PDFs oficiales:
- CNCP_listadoQ.pdf -> cncp_qualifications_data.php (756 entradas)
- Catálogo nacional de ocupaciones.pdf -> cno_occupations_sample.php (~50 entradas)

Requisitos:
- pdftotext disponible en PATH
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
DATA_DIR = ROOT / "backend" / "laravel" / "database" / "data"

CNCP_PDF = ROOT / "CNCP_listadoQ.pdf"
CNO_PDF = ROOT / "Catálogo nacional de ocupaciones.pdf"

CNCP_OUT = DATA_DIR / "cncp_qualifications_data.php"
CNO_OUT = DATA_DIR / "cno_occupations_sample.php"


FAMILY_NAMES = {
    "AFD": "Actividades físicas y deportivas",
    "ADG": "Administración y gestión",
    "AGA": "Agraria",
    "ARG": "Artes gráficas",
    "ART": "Artes y artesanías",
    "COM": "Comercio y marketing",
    "EOC": "Edificación y obra civil",
    "ELE": "Electricidad y electrónica",
    "ENA": "Energía y agua",
    "FME": "Fabricación mecánica",
    "HOT": "Hostelería y turismo",
    "IMP": "Imagen personal",
    "IMS": "Imagen y sonido",
    "INA": "Industrias alimentarias",
    "IEX": "Industrias extractivas",
    "IFC": "Informática y comunicaciones",
    "IMA": "Instalación y mantenimiento",
    "MAM": "Madera, mueble y corcho",
    "MAP": "Marítimo-pesquera",
    "QUI": "Química",
    "SAN": "Sanidad",
    "SEA": "Seguridad y medio ambiente",
    "SSC": "Servicios socioculturales y a la comunidad",
    "TCP": "Textil, confección y piel",
    "TMV": "Transporte y mantenimiento de vehículos",
    "VIC": "Vidrio y cerámica",
}


CNCP_QUOTAS = {
    "AFD": 46,
    "ADG": 15,
    "AGA": 54,
    "ARG": 33,
    "ART": 25,
    "COM": 24,
    "EOC": 36,
    "ELE": 41,
    "ENA": 19,
    "FME": 31,
    "HOT": 30,
    "IMP": 14,
    "IMS": 20,
    "INA": 30,
    "IEX": 18,
    "IFC": 27,
    "IMA": 25,
    "MAM": 20,
    "MAP": 39,
    "QUI": 27,
    "SAN": 19,
    "SEA": 29,
    "SSC": 30,
    "TCP": 47,
    "TMV": 43,
    "VIC": 14,
}


GRAN_GRUPOS = {
    "0": "Ocupaciones militares",
    "1": "Directores y gerentes",
    "2": "Técnicos y profesionales científicos e intelectuales",
    "3": "Técnicos y profesionales de apoyo",
    "4": "Empleados contables, administrativos y otros empleados de oficina",
    "5": "Trabajadores de los servicios de restauración, personales, protección y vendedores",
    "6": "Trabajadores cualificados en el sector agrícola, ganadero, forestal y pesquero",
    "7": "Artesanos y trabajadores cualificados de las industrias manufactureras y la construcción",
    "8": "Operadores de instalaciones y maquinaria, y montadores",
    "9": "Ocupaciones elementales",
}


def run_pdftotext(pdf_path: Path, layout: bool = False) -> str:
    cmd = ["pdftotext"]
    if layout:
        cmd.append("-layout")
    cmd.extend(["-enc", "UTF-8", str(pdf_path), "-"])
    return subprocess.check_output(cmd, text=True, encoding="utf-8", errors="ignore")


def php_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def normalize_text(text: str) -> str:
    text = text.replace("\u00ad", "")
    text = text.replace("\uf0df", "")
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip(" -\t\n\r")


def clean_cncp_denominacion(text: str) -> str:
    text = re.split(
        r"https?://|@INCUAL|Verde:|Rojo:|Azul:|Se ha suprimido|Sustituida|Sustituidas|Igualmente|Y también|"
        r"\b\d{2}/\d{2}\b|Cualificaciones profesionales #FP|listado Cualificaciones profesionales #FP",
        text,
        maxsplit=1,
    )[0]
    text = re.sub(r"\[.*?\]", "", text)
    return normalize_text(text)


def parse_cncp() -> list[dict]:
    text = run_pdftotext(CNCP_PDF, layout=False)

    # Captura entradas numeradas "01: XXX000_0 - Denominación"
    pattern = re.compile(
        r"(?:^|\s)(\d{2})[\.:]\s*([A-Z]{3}\d{3}_\d)\s*(?:-\s*)?(.+?)(?=(?:\s\d{2}[\.:]\s*[A-Z]{3}\d{3}_\d\s*(?:-\s*)?)|$)",
        re.S,
    )

    parsed: list[tuple[str, str]] = []
    for _idx, code, raw_den in pattern.findall(text):
        parsed.append((code, clean_cncp_denominacion(raw_den)))

    # Dedupe por primera aparición
    unique: list[tuple[str, str]] = []
    seen: set[str] = set()
    for code, den in parsed:
        if code in seen:
            continue
        seen.add(code)
        unique.append((code, den))

    # Correcciones puntuales detectadas por OCR/extracción
    forced_names = {
        "QUI405_1": "Operaciones auxiliares y de almacén en industrias y laboratorios químicos",
        "AGA780_2": "Cultivo y trabajos en palmeras",
    }

    # Aplicar cuotas oficiales por familia (página resumen)
    picked: list[dict] = []
    counters = {fam: 0 for fam in CNCP_QUOTAS}

    for code, den in unique:
        family = code[:3]
        if family not in CNCP_QUOTAS:
            continue
        if counters[family] >= CNCP_QUOTAS[family]:
            continue

        counters[family] += 1
        nivel = int(code.split("_")[-1])
        denom = forced_names.get(code, den)

        if not denom:
            continue

        picked.append(
            {
                "codigo": code,
                "denominacion": denom,
                "familia_profesional": FAMILY_NAMES[family],
                "codigo_familia": family,
                "nivel": nivel,
                "competencia_general": None,
                "entorno_profesional": None,
                "sectores_productivos": [],
                "ocupaciones": [],
                "activo": True,
            }
        )

    # Validación dura: 756 exactas
    if len(picked) != 756:
        deficits = {fam: CNCP_QUOTAS[fam] - counters[fam] for fam in CNCP_QUOTAS if counters[fam] != CNCP_QUOTAS[fam]}
        raise RuntimeError(f"No se alcanzaron 756 cualificaciones CNCP. Total={len(picked)} Deficits={deficits}")

    return picked


def parse_cno_all_4digit() -> list[tuple[str, str]]:
    text = run_pdftotext(CNO_PDF, layout=True)
    lines = text.splitlines()

    results: list[tuple[str, str]] = []
    current_code: str | None = None
    current_den: str = ""

    def flush() -> None:
        nonlocal current_code, current_den
        if current_code and current_den:
            results.append((current_code, normalize_text(current_den)))
        current_code = None
        current_den = ""

    for raw in lines:
        line = raw.rstrip()
        stripped = normalize_text(line)
        if not stripped:
            continue

        m = re.match(r"^(\d{4})\s+(.*)$", stripped)
        if m:
            flush()
            current_code = m.group(1)
            current_den = m.group(2)
            continue

        if current_code is None:
            continue

        # cortar si aparece inicio de otro nivel jerárquico/cabecera
        if re.match(r"^(\d{1,3})\s+", stripped):
            flush()
            continue

        if stripped.startswith("CATALOGO NACIONAL DE OCUPACIONES"):
            continue

        current_den += " " + stripped

    flush()

    # normaliza y dedupe
    final: list[tuple[str, str]] = []
    seen: set[str] = set()
    for code, den in results:
        den = normalize_text(den)
        if code in seen or not den:
            continue
        seen.add(code)
        final.append((code, den))

    return final


def build_cno_sample(all_entries: list[tuple[str, str]]) -> list[dict]:
    by_group: dict[str, list[tuple[str, str]]] = {str(i): [] for i in range(10)}
    for code, den in all_entries:
        group = code[0]
        if group in by_group:
            by_group[group].append((code, den))

    preferred = {
        "1": ["1111", "1120", "1211", "1321", "1411"],
        "2": ["2111", "2121", "2210", "2240", "2431", "2712"],
        "3": ["3110", "3314", "3820", "3722", "3811"],
        "4": ["4111", "4412", "4422", "4441", "4500"],
        "5": ["5110", "5120", "5220", "5611", "5811"],
        "6": ["6110", "6120", "6201", "6410", "6422"],
        "7": ["7121", "7131", "7231", "7312", "7510", "7401"],
        "8": ["8111", "8333", "8412", "8420", "8432"],
        "9": ["9100", "9210", "9310", "9511", "9602"],
        "0": ["0011", "0012", "0020"],
    }

    targets = {
        "0": 3,
        "1": 5,
        "2": 6,
        "3": 5,
        "4": 5,
        "5": 5,
        "6": 5,
        "7": 6,
        "8": 5,
        "9": 5,
    }

    selected: dict[str, tuple[str, str]] = {}

    for group, codes in preferred.items():
        available = {c: d for c, d in by_group[group]}
        for code in codes:
            if code in available:
                selected[code] = (code, available[code])
                if sum(1 for c in selected if c.startswith(group)) >= targets[group]:
                    break

    # completar automáticamente si faltan
    for group, entries in by_group.items():
        current = sum(1 for c in selected if c.startswith(group))
        if current >= targets[group]:
            continue
        for code, den in entries:
            if code in selected:
                continue
            selected[code] = (code, den)
            current += 1
            if current >= targets[group]:
                break

    sample = [selected[k] for k in sorted(selected.keys())]

    if len(sample) < 48:
        raise RuntimeError(f"Muestra CNO demasiado pequeña: {len(sample)}")

    output: list[dict] = []
    forced_cno_names = {
        "1111": "Miembros del poder ejecutivo (nacional, autonómico y local) y del poder legislativo",
    }

    for code, den in sample:
        group = code[0]
        output.append(
            {
                "codigo_cno": code,
                "denominacion": forced_cno_names.get(code, den),
                "nivel_jerarquico": 4,
                "codigo_padre": code[:3],
                "gran_grupo": group,
                "denominacion_gran_grupo": GRAN_GRUPOS[group],
                "riasec_r": 0.0,
                "riasec_i": 0.0,
                "riasec_a": 0.0,
                "riasec_s": 0.0,
                "riasec_e": 0.0,
                "riasec_c": 0.0,
                "activo": True,
            }
        )

    return output


def write_cncp_php(entries: list[dict]) -> None:
    lines: list[str] = []
    lines.append("<?php")
    lines.append("")
    lines.append("/**")
    lines.append(" * CNCP Qualifications Data - Auto-generated from CNCP_listadoQ.pdf")
    lines.append(f" * Total entries: {len(entries)}")
    lines.append(" */")
    lines.append("")
    lines.append("return [")

    for entry in entries:
        lines.append("    [")
        lines.append(f"        'codigo' => '{php_escape(entry['codigo'])}',")
        lines.append(f"        'denominacion' => '{php_escape(entry['denominacion'])}',")
        lines.append(f"        'familia_profesional' => '{php_escape(entry['familia_profesional'])}',")
        lines.append(f"        'codigo_familia' => '{php_escape(entry['codigo_familia'])}',")
        lines.append(f"        'nivel' => {entry['nivel']},")
        lines.append("        'competencia_general' => null,")
        lines.append("        'entorno_profesional' => null,")
        lines.append("        'sectores_productivos' => [],")
        lines.append("        'ocupaciones' => [],")
        lines.append("        'activo' => true,")
        lines.append("    ],")

    lines.append("];\n")
    CNCP_OUT.write_text("\n".join(lines), encoding="utf-8")


def write_cno_php(entries: list[dict]) -> None:
    lines: list[str] = []
    lines.append("<?php")
    lines.append("")
    lines.append("/**")
    lines.append(" * CNO-11 Occupations Sample Data - Auto-generated from Catálogo nacional de ocupaciones.pdf")
    lines.append(f" * Total entries: {len(entries)}")
    lines.append(" */")
    lines.append("")
    lines.append("return [")

    for entry in entries:
        lines.append("    [")
        lines.append(f"        'codigo_cno' => '{php_escape(entry['codigo_cno'])}',")
        lines.append(f"        'denominacion' => '{php_escape(entry['denominacion'])}',")
        lines.append(f"        'nivel_jerarquico' => {entry['nivel_jerarquico']},")
        lines.append(f"        'codigo_padre' => '{php_escape(entry['codigo_padre'])}',")
        lines.append(f"        'gran_grupo' => '{php_escape(entry['gran_grupo'])}',")
        lines.append(f"        'denominacion_gran_grupo' => '{php_escape(entry['denominacion_gran_grupo'])}',")
        lines.append(f"        'riasec_r' => {entry['riasec_r']:.2f},")
        lines.append(f"        'riasec_i' => {entry['riasec_i']:.2f},")
        lines.append(f"        'riasec_a' => {entry['riasec_a']:.2f},")
        lines.append(f"        'riasec_s' => {entry['riasec_s']:.2f},")
        lines.append(f"        'riasec_e' => {entry['riasec_e']:.2f},")
        lines.append(f"        'riasec_c' => {entry['riasec_c']:.2f},")
        lines.append("        'activo' => true,")
        lines.append("    ],")

    lines.append("];\n")
    CNO_OUT.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    cncp_entries = parse_cncp()
    cno_all = parse_cno_all_4digit()
    cno_sample = build_cno_sample(cno_all)

    write_cncp_php(cncp_entries)
    write_cno_php(cno_sample)

    print(f"CNCP generado: {CNCP_OUT} ({len(cncp_entries)} entradas)")
    print(f"CNO muestra generado: {CNO_OUT} ({len(cno_sample)} entradas)")


if __name__ == "__main__":
    main()
