#!/usr/bin/env python3
"""
Exportador RUCT para fase universitaria completa de VocAcción.

Extrae:
- detalle de universidades
- centros por universidad
- títulos por centro
- títulos por universidad (fallback / complemento)
- relaciones título <-> centro

Salida JSON en database/data:
- ruct_university_details.json
- ruct_centers.json
- ruct_degrees.json
- ruct_degree_center_links.json
"""

from __future__ import annotations

import argparse
import html
import json
import re
import time
from collections import defaultdict
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "database" / "data"
RUCT_BASE = "https://www.educacion.gob.es/ruct/"
RUCT_SITE_ROOT = "https://www.educacion.gob.es"


def load_json_if_exists(path: Path, default: Any) -> Any:
    if not path.exists():
        return default

    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def clean_text(value: str | None) -> str:
    if value is None:
        return ""
    value = html.unescape(value)
    value = value.replace("\xa0", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def normalize_lookup_key(value: str) -> str:
    value = clean_text(value)
    replacements = {
        'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'Á': 'a',
        'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e', 'É': 'e',
        'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i', 'Í': 'i',
        'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'Ó': 'o',
        'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u', 'Ú': 'u',
        'ñ': 'n', 'Ñ': 'n',
        '�': '',
    }
    for src, dst in replacements.items():
        value = value.replace(src, dst)
    value = re.sub(r'\s+', ' ', value).strip().lower()
    return value


def normalize_url(url: str) -> str:
    url = html.unescape(url)
    if url.startswith("http"):
        absolute = url
    else:
        absolute = urljoin(RUCT_SITE_ROOT, url)

    absolute = re.sub(r";jsessionid=[^?]+", "", absolute)
    return absolute


def fetch_soup(session: requests.Session, url: str) -> BeautifulSoup:
    response = session.get(url, timeout=90)
    response.raise_for_status()
    response.encoding = response.encoding or "iso-8859-15"
    return BeautifulSoup(response.text, "lxml")


def parse_query_params(url: str) -> dict[str, str]:
    parsed = urlparse(normalize_url(url))
    params = {k: v[0] for k, v in parse_qs(parsed.query).items() if v}
    return params


def parse_label_map(soup: BeautifulSoup) -> dict[str, str]:
    result: dict[str, str] = {}
    for label in soup.select("label"):
        label_span = label.select_one("span.label")
        if not label_span:
            continue
        key = clean_text(label_span.get_text(" ", strip=True)).rstrip(":")
        label_span.extract()
        for br in label.select("script, iframe"):
            br.extract()
        value = clean_text(label.get_text(" ", strip=True))
        if key and value:
            result[key] = value
    return result


def get_field(data: dict[str, str], *candidates: str) -> str | None:
    normalized = {normalize_lookup_key(k): v for k, v in data.items()}
    for candidate in candidates:
        value = normalized.get(normalize_lookup_key(candidate))
        if value:
            return value
    return None


def parse_total_pages(soup: BeautifulSoup) -> int:
    numbers = []
    for link in soup.select("span.pagelinks a"):
        text = clean_text(link.get_text())
        if text.isdigit():
            numbers.append(int(text))
    current = soup.select_one("span.pagelinks strong")
    if current:
        text = clean_text(current.get_text())
        if text.isdigit():
            numbers.append(int(text))
    return max(numbers) if numbers else 1


def parse_center_rows(soup: BeautifulSoup, university_code: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    table = soup.find("table", id="centro")
    if not table:
        return rows

    for tr in table.select("tbody tr"):
        tds = tr.find_all("td")
        if len(tds) < 2:
            continue
        code = clean_text(tds[0].get_text())
        center_link = tds[1].find("a")
        center_name = clean_text(center_link.get_text() if center_link else tds[1].get_text())
        titles_link = tds[2].find("a") if len(tds) > 2 else None
        accreditation = clean_text(tds[3].get_text()) if len(tds) > 3 else ""

        rows.append({
            "university_code": university_code,
            "center_code": code,
            "name": center_name,
            "detail_url": normalize_url(center_link["href"]) if center_link and center_link.get("href") else None,
            "titles_url": normalize_url(titles_link["href"]) if titles_link and titles_link.get("href") else None,
            "institutional_accreditation": accreditation or None,
        })
    return rows


def parse_degree_rows(soup: BeautifulSoup, university_code: str, center_code: str | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    table = soup.find("table", id="verificacion") or soup.find("table", id="estudio") or soup.find("table")
    if not table:
        return rows

    for tr in table.select("tbody tr"):
        tds = tr.find_all("td")
        if len(tds) < 4:
            continue
        code = clean_text(tds[0].get_text())
        anchor = tds[1].find("a")
        title = clean_text(anchor.get_text() if anchor else tds[1].get_text())
        link = normalize_url(anchor["href"]) if anchor and anchor.get("href") else None
        params = parse_query_params(link) if link else {}
        level_name = clean_text(tds[2].get_text())
        status_name = clean_text(tds[3].get_text())
        accreditation = clean_text(tds[4].get_text()) if len(tds) > 4 else ""

        rows.append({
            "study_code": params.get("codigoEstudio") or params.get("CodigoEstudio") or code,
            "cycle_code": params.get("codigoCiclo"),
            "university_code": university_code,
            "center_code": center_code,
            "name": title,
            "listing_level_name": level_name or None,
            "listing_status_name": status_name or None,
            "listing_accreditation": accreditation or None,
            "detail_url": link,
        })
    return rows


def paged_urls(base_url: str, total_pages: int) -> list[str]:
    urls = [normalize_url(base_url)]
    parsed = urlparse(normalize_url(base_url))
    query = parse_qs(parsed.query)
    pagination_keys = [k for k in query.keys() if k.startswith("d-") and k.endswith("-p")]
    page_key = pagination_keys[0] if pagination_keys else None

    if not page_key:
        if total_pages <= 1:
            return urls
        # fallback convencional de displaytag conocido
        page_key = "d-1335801-p"

    for page in range(2, total_pages + 1):
        query_copy = {k: v[:] for k, v in query.items()}
        query_copy[page_key] = [str(page)]
        query_str = "&".join(f"{k}={v[0]}" for k, v in query_copy.items())
        urls.append(f"{parsed.scheme}://{parsed.netloc}{parsed.path}?{query_str}")
    return urls


def parse_university_detail(session: requests.Session, university_code: str) -> dict[str, Any]:
    detail_url = normalize_url(f"{RUCT_BASE}universidad.action?codigoUniversidad={university_code}&actual=universidades")
    soup = fetch_soup(session, detail_url)
    data = parse_label_map(soup)

    return {
        "ruct_code": university_code,
        "name": clean_text(soup.find("h2").get_text(" ", strip=True)) if soup.find("h2") else None,
        "acronym": get_field(data, "Acrónimo"),
        "ownership_type": get_field(data, "Tipo"),
        "cif": get_field(data, "CIF"),
        "erasmus_code": get_field(data, "Código Erasmus"),
        "for_profit": get_field(data, "Con Ánimo de lucro"),
        "responsible_administration_name": get_field(data, "Administración Educativa Responsable"),
        "address": get_field(data, "Domicilio"),
        "postal_code": get_field(data, "Código postal"),
        "locality": get_field(data, "Localidad"),
        "municipality": get_field(data, "Municipio"),
        "province": get_field(data, "Provincia"),
        "autonomous_community_name": get_field(data, "Comunidad Autónoma"),
        "website": get_field(data, "URL"),
        "email": get_field(data, "E-mail"),
        "phone_1": get_field(data, "Teléfono 1"),
        "phone_2": get_field(data, "Teléfono 2"),
        "fax": get_field(data, "Fax"),
        "source_url": detail_url,
    }


def parse_center_detail(session: requests.Session, url: str) -> dict[str, Any]:
    soup = fetch_soup(session, url)
    data = parse_label_map(soup)
    h3_tags = soup.find_all("h3")

    return {
        "name": clean_text(h3_tags[0].get_text(" ", strip=True)) if h3_tags else None,
        "ruct_center_code": get_field(data, "Código del centro"),
        "center_type": get_field(data, "Tipo de centro"),
        "legal_nature": get_field(data, "Calificación jurídica"),
        "attachment_type": get_field(data, "Naturaleza vinculación"),
        "address": get_field(data, "Domicilio"),
        "postal_code": get_field(data, "Código postal"),
        "locality": get_field(data, "Localidad"),
        "municipality": get_field(data, "Municipio"),
        "province": get_field(data, "Provincia"),
        "autonomous_community_name": get_field(data, "Comunidad Autónoma"),
        "source_url": normalize_url(url),
    }


def export_catalog(
    limit: int | None = None,
    start_index: int = 0,
    sleep_ms: int = 0,
    universities: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    if universities is None:
        with open(DATA_DIR / "ruct_universities.json", "r", encoding="utf-8") as fh:
            universities_payload = json.load(fh)

        universities = universities_payload["universities"]

    if start_index:
        universities = universities[start_index:]
    if limit:
        universities = universities[:limit]

    session = requests.Session()
    session.headers.update({"User-Agent": "VocAccion-RUCT-Importer/1.0"})

    university_details: list[dict[str, Any]] = []
    centers_by_code: dict[str, dict[str, Any]] = {}
    degrees_by_code: dict[str, dict[str, Any]] = {}
    degree_center_links: set[tuple[str, str]] = set()

    for index, university in enumerate(universities, start=1):
        code = university["code"]
        print(f"[{index}/{len(universities)}] University {code} - {university['name']}")

        try:
            u_detail = parse_university_detail(session, code)
            u_detail["source_name"] = university["name"]
            university_details.append(u_detail)

            centers_url = normalize_url(f"{RUCT_BASE}universidadcentros.action?codigoUniversidad={code}&actual=universidades")
            centers_first = fetch_soup(session, centers_url)
            center_pages = paged_urls(centers_url, parse_total_pages(centers_first))

            for page_url in center_pages:
                soup = centers_first if page_url == center_pages[0] else fetch_soup(session, page_url)
                for row in parse_center_rows(soup, code):
                    ccode = row["center_code"]
                    if ccode not in centers_by_code and row["detail_url"]:
                        detail = parse_center_detail(session, row["detail_url"])
                        centers_by_code[ccode] = {
                            "university_code": code,
                            "ruct_center_code": ccode,
                            "name": detail.get("name") or row["name"],
                            "center_type": detail.get("center_type"),
                            "legal_nature": detail.get("legal_nature"),
                            "attachment_type": detail.get("attachment_type"),
                            "address": detail.get("address"),
                            "postal_code": detail.get("postal_code"),
                            "locality": detail.get("locality"),
                            "municipality": detail.get("municipality"),
                            "province": detail.get("province"),
                            "autonomous_community_name": detail.get("autonomous_community_name") or u_detail.get("autonomous_community_name"),
                            "institutional_accreditation": row.get("institutional_accreditation"),
                            "source_url": row["detail_url"],
                        }

                    if row.get("titles_url"):
                        center_titles_first = fetch_soup(session, row["titles_url"])
                        title_pages = paged_urls(row["titles_url"], parse_total_pages(center_titles_first))
                        for t_url in title_pages:
                            tsoup = center_titles_first if t_url == title_pages[0] else fetch_soup(session, t_url)
                            for degree in parse_degree_rows(tsoup, code, ccode):
                                dcode = degree["study_code"]
                                if not dcode:
                                    continue
                                current = degrees_by_code.get(dcode)
                                if current is None:
                                    degrees_by_code[dcode] = degree
                                else:
                                    # mantener nombre más largo y urls si faltan
                                    if len(degree.get("name") or "") > len(current.get("name") or ""):
                                        current["name"] = degree.get("name")
                                    current["listing_level_name"] = current.get("listing_level_name") or degree.get("listing_level_name")
                                    current["listing_status_name"] = current.get("listing_status_name") or degree.get("listing_status_name")
                                    current["detail_url"] = current.get("detail_url") or degree.get("detail_url")
                                degree_center_links.add((dcode, ccode))

                if sleep_ms:
                    time.sleep(sleep_ms / 1000)

            # fallback adicional: títulos por universidad para capturar huecos no vistos en centros
            titles_url = normalize_url(f"{RUCT_BASE}listaestudiosuniversidad.action?codigoUniversidad={code}&actual=universidades")
            titles_first = fetch_soup(session, titles_url)
            title_pages = paged_urls(titles_url, parse_total_pages(titles_first))
            for t_url in title_pages:
                tsoup = titles_first if t_url == title_pages[0] else fetch_soup(session, t_url)
                for degree in parse_degree_rows(tsoup, code, None):
                    dcode = degree["study_code"]
                    if not dcode:
                        continue
                    if dcode not in degrees_by_code:
                        degrees_by_code[dcode] = degree
                if sleep_ms:
                    time.sleep(sleep_ms / 1000)

        except Exception as exc:  # noqa: BLE001
            print(f"ERROR processing university {code}: {exc}")

    return {
        "universities": university_details,
        "centers": sorted(centers_by_code.values(), key=lambda x: (x["university_code"], x["ruct_center_code"])),
        "degrees": sorted(degrees_by_code.values(), key=lambda x: (x["university_code"], x["study_code"])),
        "degree_center_links": [
            {"study_code": study_code, "center_code": center_code}
            for study_code, center_code in sorted(degree_center_links)
        ],
    }


def merge_payload_with_existing(payload: dict[str, Any]) -> dict[str, Any]:
    existing_universities = load_json_if_exists(DATA_DIR / "ruct_university_details.json", [])
    existing_centers = load_json_if_exists(DATA_DIR / "ruct_centers.json", [])
    existing_degrees = load_json_if_exists(DATA_DIR / "ruct_degrees.json", [])
    existing_links = load_json_if_exists(DATA_DIR / "ruct_degree_center_links.json", [])

    universities_by_code: dict[str, dict[str, Any]] = {
        item["ruct_code"]: item for item in existing_universities if item.get("ruct_code")
    }
    for item in payload["universities"]:
        if item.get("ruct_code"):
            universities_by_code[item["ruct_code"]] = item

    centers_by_code: dict[str, dict[str, Any]] = {
        item["ruct_center_code"]: item for item in existing_centers if item.get("ruct_center_code")
    }
    for item in payload["centers"]:
        if item.get("ruct_center_code"):
            centers_by_code[item["ruct_center_code"]] = item

    degrees_by_code: dict[str, dict[str, Any]] = {
        item["study_code"]: item for item in existing_degrees if item.get("study_code")
    }
    for item in payload["degrees"]:
        if item.get("study_code"):
            degrees_by_code[item["study_code"]] = item

    link_keys = {
        (item.get("study_code"), item.get("center_code"))
        for item in existing_links
        if item.get("study_code") and item.get("center_code")
    }
    for item in payload["degree_center_links"]:
        if item.get("study_code") and item.get("center_code"):
            link_keys.add((item["study_code"], item["center_code"]))

    return {
        "universities": sorted(universities_by_code.values(), key=lambda x: x["ruct_code"]),
        "centers": sorted(centers_by_code.values(), key=lambda x: (x["university_code"], x["ruct_center_code"])),
        "degrees": sorted(degrees_by_code.values(), key=lambda x: (x["university_code"], x["study_code"])),
        "degree_center_links": [
            {"study_code": study_code, "center_code": center_code}
            for study_code, center_code in sorted(link_keys)
        ],
    }


def write_outputs(payload: dict[str, Any], merge_existing: bool = False) -> None:
    if merge_existing:
        payload = merge_payload_with_existing(payload)

    (DATA_DIR / "ruct_university_details.json").write_text(
        json.dumps(payload["universities"], ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (DATA_DIR / "ruct_centers.json").write_text(
        json.dumps(payload["centers"], ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (DATA_DIR / "ruct_degrees.json").write_text(
        json.dumps(payload["degrees"], ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (DATA_DIR / "ruct_degree_center_links.json").write_text(
        json.dumps(payload["degree_center_links"], ensure_ascii=False, indent=2), encoding="utf-8"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Export official university phase data from RUCT")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of universities for test runs")
    parser.add_argument("--start-index", type=int, default=0, help="Start offset in universities list for chunked runs")
    parser.add_argument("--sleep-ms", type=int, default=0, help="Optional delay between paginated requests")
    parser.add_argument(
        "--skip-known",
        action="store_true",
        help="Skip universities already present in ruct_university_details.json to resume previous exports",
    )
    parser.add_argument(
        "--merge-existing",
        action="store_true",
        help="Merge newly exported records with existing JSON outputs instead of overwriting them",
    )
    args = parser.parse_args()

    universities = None
    if args.skip_known:
        with open(DATA_DIR / "ruct_universities.json", "r", encoding="utf-8") as fh:
            universities_payload = json.load(fh)

        known_universities = load_json_if_exists(DATA_DIR / "ruct_university_details.json", [])
        known_codes = {item.get("ruct_code") for item in known_universities if item.get("ruct_code")}
        universities = [item for item in universities_payload["universities"] if item.get("code") not in known_codes]

    payload = export_catalog(
        limit=args.limit,
        start_index=args.start_index,
        sleep_ms=args.sleep_ms,
        universities=universities,
    )
    write_outputs(payload, merge_existing=args.merge_existing or args.skip_known)
    print(f"Universities: {len(payload['universities'])}")
    print(f"Centers: {len(payload['centers'])}")
    print(f"Degrees: {len(payload['degrees'])}")
    print(f"Degree-center links: {len(payload['degree_center_links'])}")


if __name__ == "__main__":
    main()
