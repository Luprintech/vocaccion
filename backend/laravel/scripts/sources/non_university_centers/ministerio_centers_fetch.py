"""
scraper_centros.py
==================
Extrae datos completos de centros educativos del Ministerio de Educación.
Guarda:
  - centros_con_formaciones.json        → todos (España completa)
  - por_comunidad/<nombre_ccaa>.json    → uno por CCAA

Uso:
    pip install requests beautifulsoup4 xlrd pandas

    python scraper_centros.py --todo-espana              # toda España
    python scraper_centros.py --todo-espana --continuar  # reanudar
    python scraper_centros.py --xls xls/centros_Andalucía.xls --limite 5  # prueba
"""

import argparse
import json
import time
import random
import os
import glob

import pandas as pd
import requests
from bs4 import BeautifulSoup

# ── Config ─────────────────────────────────────────────────────────────────────
POST_URL           = "https://www.educacion.gob.es/centros/detalleCentro"
OUTPUT_JSON        = "centros_con_formaciones.json"       # global España
CARPETA_COMUNIDAD  = "por_comunidad"                      # uno por CCAA

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9",
    "Content-Type": "application/x-www-form-urlencoded",
    "Origin": "https://www.educacion.gob.es",
    "Referer": "https://www.educacion.gob.es/centros/buscarCentros",
}

DELAY_MIN = 1.5
DELAY_MAX = 3.0

ID_COMUNIDAD = {
    "andalucia":       "01",
    "aragon":          "02",
    "asturias":        "03",
    "baleares":        "04",
    "canarias":        "05",
    "cantabria":       "06",
    "castilla-mancha": "07",
    "castilla-leon":   "08",
    "cataluna":        "09",
    "extremadura":     "10",
    "galicia":         "11",
    "madrid":          "13",
    "murcia":          "14",
    "navarra":         "15",
    "pais-vasco":      "16",
    "la-rioja":        "17",
    "valencia":        "18",
    "ceuta":           "19",
    "melilla":         "20",
}

NOMBRE_A_CLAVE = {
    "andaluc":  "andalucia",
    "arag":     "aragon",
    "astur":    "asturias",
    "balear":   "baleares",
    "canar":    "canarias",
    "cantabr":  "cantabria",
    "mancha":   "castilla-mancha",
    "catalu":   "cataluna",
    "extrem":   "extremadura",
    "galic":    "galicia",
    "madrid":   "madrid",
    "murcia":   "murcia",
    "navarr":   "navarra",
    "vasco":    "pais-vasco",
    "rioja":    "la-rioja",
    "valenc":   "valencia",
    "ceuta":    "ceuta",
    "melill":   "melilla",
    "leon":     "castilla-leon",
}
# ──────────────────────────────────────────────────────────────────────────────


def detectar_comunidad(df):
    if "COMUNIDAD AUTÓNOMA" in df.columns:
        valor = df["COMUNIDAD AUTÓNOMA"].dropna().iloc[0].lower()
        for fragmento, clave in NOMBRE_A_CLAVE.items():
            if fragmento in valor:
                return clave
    return None


def nombre_fichero_ccaa(clave):
    """Devuelve el path del JSON de la CCAA."""
    os.makedirs(CARPETA_COMUNIDAD, exist_ok=True)
    return os.path.join(CARPETA_COMUNIDAD, f"{clave}.json")


def cargar_json(path):
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        lista = json.load(f)
    return {str(item["codigo"]): item for item in lista if not item.get("error")}


def guardar_json(path, resultados):
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(list(resultados.values()), f, ensure_ascii=False, indent=2)


def cargar_xls(path, provincia=None):
    df = pd.read_excel(path, engine="xlrd")
    df = df.astype(str)
    df.columns = df.columns.str.strip()
    if provincia:
        df = df[df["PROVINCIA"].str.strip().str.lower() == provincia.lower()]
        print(f"  Filtrado por provincia '{provincia}': {len(df)} centros")
    return df


def extraer_ensenanzas(soup):
    ensenanzas = []
    seccion = None
    for tag in soup.find_all(["h2", "h3", "h4", "h5"]):
        if "nse" in tag.get_text().lower():
            seccion = tag
            break
    tabla = seccion.find_next("table") if seccion else None
    if not tabla:
        for t in soup.find_all("table"):
            h = t.find("tr")
            if h and "nse" in h.get_text().lower():
                tabla = t
                break
    if not tabla:
        return ensenanzas
    grado_actual = ""
    for fila in tabla.find_all("tr")[1:]:
        celdas = fila.find_all("td")
        if not celdas:
            continue
        valores = [td.get_text(strip=True) for td in celdas]
        if len(valores) == 4:
            grado_actual = valores[0] if valores[0] else grado_actual
            ensenanzas.append({
                "grado": grado_actual, "familia": valores[1],
                "ensenanza": valores[2], "modalidad": valores[3],
            })
        elif len(valores) == 3:
            ensenanzas.append({
                "grado": grado_actual, "familia": valores[0],
                "ensenanza": valores[1], "modalidad": valores[2],
            })
    return ensenanzas


def extraer_ficha(soup):
    ficha = {}
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "mailto:" in href:
            email = href.replace("mailto:", "").strip()
            if "educacion.gob" not in email:
                ficha["email"] = email
        elif (href.startswith("http")
              and "educacion.gob.es" not in href
              and href != "http://null"):
            ficha["web_centro"] = href
    return ficha


def procesar_centro(session, codigo, id_comunidad):
    payload = {
        "codCentro": codigo, "idComunidad": id_comunidad,
        "idProvincia": "00", "nivel": "0", "naturaleza": "0",
        "concertado": "", "familia": "0", "ensenanza": "0",
        "modalidad": "0", "tipoCentro": "0",
    }
    try:
        resp = session.post(POST_URL, data=payload, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        return {
            "ensenanzas": extraer_ensenanzas(soup),
            "ficha_web":  extraer_ficha(soup),
            "error":      None,
        }
    except requests.RequestException as e:
        return {"ensenanzas": [], "ficha_web": {}, "error": str(e)}


def construir_registro(fila, resultado):
    return {
        "codigo":     str(fila.get("CÓDIGO", "")).strip(),
        "nombre":     str(fila.get("DENOMINACIÓN ESPECÍFICA", "")).strip(),
        "tipo":       str(fila.get("DENOMINACIÓN GENÉRICA", "")).strip(),
        "naturaleza": str(fila.get("NATURALEZA", "")).strip(),
        "provincia":  str(fila.get("PROVINCIA", "")).strip(),
        "localidad":  str(fila.get("LOCALIDAD", "")).strip(),
        "domicilio":  str(fila.get("DOMICILIO", "")).strip(),
        "cp":         str(fila.get("CÓD POSTAL", "")).strip(),
        "telefono":   str(fila.get("TELÉFONO", "")).strip(),
        "email":      resultado["ficha_web"].get("email", ""),
        "web_centro": resultado["ficha_web"].get("web_centro", ""),
        "ensenanzas": resultado["ensenanzas"],
        "error":      resultado["error"],
    }


def procesar_xls(xls_path, id_comunidad, clave_ccaa, provincia,
                 limite, resultados_global, session):

    print(f"\n📂 {xls_path}  (CCAA: {clave_ccaa}, id={id_comunidad})")
    df = cargar_xls(xls_path, provincia)

    # Cargar JSON propio de esta CCAA (para continuar si se interrumpió)
    json_ccaa = nombre_fichero_ccaa(clave_ccaa)
    resultados_ccaa = cargar_json(json_ccaa)

    codigos = df["CÓDIGO"].str.strip().tolist()
    if limite:
        codigos = codigos[:limite]

    # Pendientes = no están en el global ni en el de la CCAA
    pendientes = [c for c in codigos
                  if c not in resultados_global and c not in resultados_ccaa]
    total = len(pendientes)
    ya = len(resultados_ccaa)
    print(f"  Pendientes: {total}  |  Ya procesados esta CCAA: {ya}")

    for i, codigo in enumerate(pendientes, 1):
        filas = df[df["CÓDIGO"].str.strip() == codigo]
        if filas.empty:
            continue
        fila = filas.iloc[0]
        nombre = str(fila.get("DENOMINACIÓN ESPECÍFICA", ""))
        print(f"  [{i}/{total}] {codigo} — {nombre[:50]}", end=" ... ")

        resultado = procesar_centro(session, codigo, id_comunidad)
        registro  = construir_registro(fila, resultado)

        n = len(registro["ensenanzas"])
        print(f"{'❌ ERROR' if resultado['error'] else f'✅ {n} enseñanzas'}")

        # Guardar en ambos dicts
        resultados_ccaa[codigo]   = registro
        resultados_global[codigo] = registro

        # Checkpoint cada 10: guarda JSON de CCAA + global
        if i % 10 == 0:
            guardar_json(json_ccaa,    resultados_ccaa)
            guardar_json(OUTPUT_JSON,  resultados_global)
            print(f"  💾 Checkpoint — CCAA: {len(resultados_ccaa)} | Global: {len(resultados_global)}")

        time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    # Guardado final de esta CCAA
    guardar_json(json_ccaa, resultados_ccaa)
    print(f"  ✅ CCAA completada → {json_ccaa}  ({len(resultados_ccaa)} centros)")

    return resultados_global


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--xls",         help="Ruta al XLS de una CCAA")
    parser.add_argument("--comunidad",   help="Clave CCAA (ej: andalucia)")
    parser.add_argument("--provincia",   help="Filtrar por provincia")
    parser.add_argument("--limite",      type=int, default=0)
    parser.add_argument("--continuar",   action="store_true",
                        help="Reanudar: salta los ya procesados sin error")
    parser.add_argument("--todo-espana", action="store_true",
                        help="Procesa todos los XLS en xls/")
    args = parser.parse_args()

    os.makedirs(CARPETA_COMUNIDAD, exist_ok=True)

    # Cargar resultados globales previos si --continuar
    resultados_global = cargar_json(OUTPUT_JSON) if args.continuar else {}

    session = requests.Session()

    if args.todo_espana:
        archivos = sorted(glob.glob("xls/*.xls") + glob.glob("xls/*.xlsx"))
        if not archivos:
            print("❌ No hay archivos en xls/")
            return
        print(f"📋 Modo España completa: {len(archivos)} archivos")
        for xls_path in archivos:
            df_tmp = pd.read_excel(xls_path, engine="xlrd", nrows=1).astype(str)
            df_tmp.columns = df_tmp.columns.str.strip()
            clave = detectar_comunidad(df_tmp)
            if not clave:
                print(f"⚠️  No pude detectar CCAA de {xls_path}, saltando")
                continue
            id_com = ID_COMUNIDAD[clave]
            resultados_global = procesar_xls(
                xls_path, id_com, clave, None,
                args.limite, resultados_global, session
            )
            # Guardar global tras cada CCAA completa
            guardar_json(OUTPUT_JSON, resultados_global)

    else:
        if not args.xls:
            print("❌ Indica --xls o usa --todo-espana")
            return
        if args.comunidad:
            clave = args.comunidad.lower()
        else:
            df_tmp = pd.read_excel(args.xls, engine="xlrd", nrows=1).astype(str)
            df_tmp.columns = df_tmp.columns.str.strip()
            clave = detectar_comunidad(df_tmp)
            if not clave:
                print("❌ No pude detectar la CCAA. Usa --comunidad")
                return
            print(f"🔍 CCAA detectada: {clave}")
        id_com = ID_COMUNIDAD.get(clave)
        if not id_com:
            print(f"❌ Comunidad '{clave}' no reconocida.")
            return
        resultados_global = procesar_xls(
            args.xls, id_com, clave, args.provincia,
            args.limite, resultados_global, session
        )
        guardar_json(OUTPUT_JSON, resultados_global)

    exitosos = sum(1 for v in resultados_global.values() if not v.get("error"))
    print(f"\n🏁 COMPLETADO")
    print(f"   Global:        {OUTPUT_JSON}  ({exitosos}/{len(resultados_global)} centros)")
    print(f"   Por comunidad: {CARPETA_COMUNIDAD}/")


if __name__ == "__main__":
    main()
