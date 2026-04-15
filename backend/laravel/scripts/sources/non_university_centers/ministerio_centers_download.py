"""
descargar_centros.py
====================
Descarga automáticamente el Excel de centros de cada CCAA
desde el buscador del Ministerio de Educación.
Guarda un XLS por CCAA en la carpeta xls/

Uso:
    pip install requests
    python descargar_centros.py                    # todas las CCAA
    python descargar_centros.py --ccaa andalucia   # solo una
"""

import argparse
import os
import time
import random
import requests

# ── Configuración ──────────────────────────────────────────────────────────────
CARPETA_SALIDA = "xls"

BUSCAR_URL = "https://www.educacion.gob.es/centros/buscarCentros"
EXCEL_URL  = "https://www.educacion.gob.es/centros/exportarListadoCentrosExcel"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9",
    "Content-Type": "application/x-www-form-urlencoded",
    "Origin": "https://www.educacion.gob.es",
    "Referer": "https://www.educacion.gob.es/centros/buscarCentros",
}

# CCAA con su idComunidad y nombre de archivo de salida
COMUNIDADES = {
    "andalucia":       {"id": "01", "nombre": "Andalucía"},
    "aragon":          {"id": "02", "nombre": "Aragón"},
    "asturias":        {"id": "03", "nombre": "Asturias"},
    "baleares":        {"id": "04", "nombre": "Illes_Balears"},
    "canarias":        {"id": "05", "nombre": "Canarias"},
    "cantabria":       {"id": "06", "nombre": "Cantabria"},
    "castilla-mancha": {"id": "07", "nombre": "Castilla-La_Mancha"},
    "castilla-leon":   {"id": "08", "nombre": "Castilla_y_León"},
    "cataluna":        {"id": "09", "nombre": "Cataluña"},
    "extremadura":     {"id": "10", "nombre": "Extremadura"},
    "galicia":         {"id": "11", "nombre": "Galicia"},
    "madrid":          {"id": "13", "nombre": "Madrid"},
    "murcia":          {"id": "14", "nombre": "Murcia"},
    "navarra":         {"id": "15", "nombre": "Navarra"},
    "pais-vasco":      {"id": "16", "nombre": "País_Vasco"},
    "la-rioja":        {"id": "17", "nombre": "La_Rioja"},
    "valencia":        {"id": "18", "nombre": "C_Valenciana"},
    "ceuta":           {"id": "19", "nombre": "Ceuta"},
    "melilla":         {"id": "20", "nombre": "Melilla"},
}

DELAY_MIN = 3.0
DELAY_MAX = 6.0
# ──────────────────────────────────────────────────────────────────────────────


def payload_base(id_comunidad):
    """Payload completo tal como lo envía el navegador (extraído del DevTools)."""
    return {
        "nivel":        "0",
        "idComunidad":  id_comunidad,
        "idProvincia":  "00",
        "naturaleza":   "0",
        "concertado":   "",
        "familia":      "0",
        "ensenanza":    "0",
        "modalidad":    "0",
        "tipoCentro":   "0",
        "provincial":   "",
        "comarca":      "0",
        "pais":         "",
        "localidad":    "",
        "denominacion": "",
        "codCentro":    "",
        "nombreCentro": "",
    }


def descargar_ccaa(session, clave, info):
    nombre  = info["nombre"]
    id_com  = info["id"]
    fichero = os.path.join(CARPETA_SALIDA, f"centros_{nombre}.xls")

    if os.path.exists(fichero):
        print(f"  ⏭️  Ya existe: {fichero} — saltando")
        return True

    print(f"  🔍 Buscando centros de {nombre}...", end=" ", flush=True)

    # Paso 1: POST de búsqueda para establecer sesión/cookies
    try:
        resp = session.post(
            BUSCAR_URL,
            data=payload_base(id_com),
            headers=HEADERS,
            timeout=30
        )
        resp.raise_for_status()
        print(f"OK ({resp.status_code})", end=" → ", flush=True)
    except requests.RequestException as e:
        print(f"❌ Error en búsqueda: {e}")
        return False

    # Paso 2: POST para exportar Excel (mismo payload, endpoint diferente)
    headers_excel = HEADERS.copy()
    headers_excel["Accept"] = "application/vnd.ms-excel,application/octet-stream,*/*"
    headers_excel["Referer"] = BUSCAR_URL

    try:
        resp_excel = session.post(
            EXCEL_URL,
            data=payload_base(id_com),
            headers=headers_excel,
            timeout=60,
            stream=True
        )
        resp_excel.raise_for_status()

        content_type = resp_excel.headers.get("Content-Type", "")

        # Si devuelve HTML en vez de Excel, algo falló
        if "html" in content_type and "excel" not in content_type and "spreadsheet" not in content_type:
            print(f"⚠️  Respuesta inesperada (HTML). Content-Type: {content_type}")
            error_path = fichero.replace(".xls", "_error.html")
            with open(error_path, "w", encoding="utf-8") as f:
                f.write(resp_excel.text[:8000])
            print(f"     HTML guardado en {error_path} para inspección")
            return False

        # Guardar el Excel
        with open(fichero, "wb") as f:
            for chunk in resp_excel.iter_content(chunk_size=8192):
                f.write(chunk)

        size_kb = os.path.getsize(fichero) / 1024
        print(f"✅ {size_kb:.0f} KB → {fichero}")
        return True

    except requests.RequestException as e:
        print(f"❌ Error descargando Excel: {e}")
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ccaa", help="Clave CCAA (ej: andalucia). Sin esto descarga todas.")
    args = parser.parse_args()

    os.makedirs(CARPETA_SALIDA, exist_ok=True)

    if args.ccaa:
        clave = args.ccaa.lower()
        if clave not in COMUNIDADES:
            print(f"❌ CCAA '{clave}' no reconocida.")
            print(f"   Opciones: {', '.join(COMUNIDADES.keys())}")
            return
        comunidades = {clave: COMUNIDADES[clave]}
    else:
        comunidades = COMUNIDADES

    session = requests.Session()
    total = len(comunidades)
    exitosos = 0

    print(f"📋 Descargando {total} CCAA en carpeta '{CARPETA_SALIDA}/'")
    print("─" * 55)

    for i, (clave, info) in enumerate(comunidades.items(), 1):
        print(f"[{i}/{total}] {info['nombre']}")
        ok = descargar_ccaa(session, clave, info)
        if ok:
            exitosos += 1

        if i < total:
            pausa = random.uniform(DELAY_MIN, DELAY_MAX)
            print(f"  ⏳ Pausa {pausa:.1f}s...")
            time.sleep(pausa)

    print("─" * 55)
    print(f"✅ Completado: {exitosos}/{total} CCAA en '{CARPETA_SALIDA}/'")

    if exitosos > 0:
        print(f"\n🚀 Ahora lanza el scraper de detalles:")
        print(f"   python scraper_centros.py --todo-espana")


if __name__ == "__main__":
    main()
