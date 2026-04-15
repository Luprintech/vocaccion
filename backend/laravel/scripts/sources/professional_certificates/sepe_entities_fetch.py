"""
scraper_entidades_sepe.py
=========================
Extrae entidades de formación por especialidad del SEPE usando Selenium.

Flujo real descubierto por inspección del HTML:
  1. Buscar código → tabla con getEntidadesFormacion(ID_INTERNO)
  2. Setear input[id$=':codigoPropuesta'] = ID_INTERNO
  3. Click en input[id$=':invisibleClickTargetEntidadesFormacion']
  4. Extraer tabla de entidades con DataTables (paginada)

Uso:
    pip install selenium webdriver-manager
    python scraper_entidades_sepe.py --limite 5   # prueba
    python scraper_entidades_sepe.py              # todo
    python scraper_entidades_sepe.py --continuar  # reanudar
"""

import argparse
import json
import time
import os
import random
import re

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException
from webdriver_manager.chrome import ChromeDriverManager

# ── Config ─────────────────────────────────────────────────────────────────────
INPUT_JSON   = "certificados_profesionales_sepe.json"
OUTPUT_JSON  = "entidades_por_especialidad.json"
BUSCADOR_URL = "https://sede.sepe.gob.es/FOET_CATALOGO_EEFF_SEDE/flows/buscarEspecialidadesNA"
DELAY        = (2.0, 4.0)
# ──────────────────────────────────────────────────────────────────────────────


def crear_driver(headless=True):
    ops = Options()
    if headless:
        ops.add_argument("--headless=new")
    ops.add_argument("--no-sandbox")
    ops.add_argument("--disable-dev-shm-usage")
    ops.add_argument("--disable-gpu")
    ops.add_argument("--window-size=1400,900")
    ops.add_argument("--lang=es-ES")
    ops.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    ops.add_experimental_option("excludeSwitches", ["enable-logging"])
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=ops)
    driver.set_page_load_timeout(30)
    return driver


def esperar_y_buscar(driver, codigo):
    """
    Abre el buscador, introduce el código y hace click en Buscar.
    Devuelve el ID interno si encuentra resultado, o None.
    """
    driver.get(BUSCADOR_URL)
    time.sleep(2)

    # Aceptar cookies si aparece
    try:
        btn = WebDriverWait(driver, 3).until(
            EC.element_to_be_clickable((By.XPATH,
                "//button[contains(text(),'Aceptar') or contains(text(),'aceptar')]"
            ))
        )
        btn.click()
        time.sleep(1)
    except TimeoutException:
        pass

    # Introducir código
    try:
        campo = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "formulario:codigoWrapper:codigoEsp"))
        )
        campo.clear()
        campo.send_keys(codigo)
    except TimeoutException:
        return None

    # Buscar
    try:
        driver.find_element(By.ID, "formulario:bBuscar").click()
        time.sleep(2.5)
    except NoSuchElementException:
        return None

    # Extraer ID interno del onclick de getEntidadesFormacion
    try:
        # Buscar enlace/botón con onclick=getEntidadesFormacion(XXXXX)
        elementos = driver.find_elements(By.XPATH,
            "//*[contains(@onclick,'getEntidadesFormacion')]"
        )
        for el in elementos:
            onclick = el.get_attribute("onclick") or ""
            m = re.search(r"getEntidadesFormacion\((\d+)\)", onclick)
            if m:
                return m.group(1)
    except Exception:
        pass

    return None


def obtener_entidades(driver, id_interno):
    """
    Dado el ID interno, activa el panel de entidades y extrae todos los registros.
    """
    # Setear el ID interno en el input hidden
    try:
        script = f"""
        const input = document.querySelector("input[id$=':codigoPropuesta']");
        if (input) input.value = '{id_interno}';
        """
        driver.execute_script(script)
        time.sleep(0.3)

        # Click en el botón invisible de entidades
        btn = driver.find_element(By.CSS_SELECTOR,
            "input[id$=':invisibleClickTargetEntidadesFormacion']"
        )
        driver.execute_script("arguments[0].click();", btn)
        time.sleep(3)

    except Exception as e:
        print(f"    ⚠️  Error activando entidades: {e}")
        return []

    # Cambiar a mostrar todos los registros (DataTables "Ver N líneas")
    try:
        select_ver = driver.find_elements(By.CSS_SELECTOR,
            "select[name*='_length'], .dataTables_length select"
        )
        if select_ver:
            from selenium.webdriver.support.ui import Select
            sel = Select(select_ver[0])
            # Seleccionar la opción más grande disponible
            opciones = [o.get_attribute("value") for o in sel.options]
            # Opciones típicas: 10, 25, 50, 100, -1
            for val in ["-1", "100", "50", "25"]:
                if val in opciones:
                    sel.select_by_value(val)
                    time.sleep(2)
                    break
    except Exception:
        pass

    # Extraer entidades paginando
    # Estructura real del DOM:
    # - Fila principal: <tr> con 5 <td> (btn-expand, id, nombre, tipo, provincia)
    # - Fila detalle:   <tr> con 1 <td colspan="5"> con tabla anidada .tablaDetalle
    todas = []
    pagina = 1

    def es_fila_detalle(fila):
        """Detecta fila de detalle: primera celda tiene colspan=5 o contiene 'NIF titular'."""
        try:
            celdas = fila.find_elements(By.TAG_NAME, "td")
            if not celdas:
                return False
            primera = celdas[0]
            # Opción 1: colspan=5 en primera celda
            if primera.get_attribute("colspan") == "5":
                return True
            # Opción 2: texto contiene NIF titular (tabla anidada visible en DOM)
            texto = primera.text.strip()
            if texto.startswith("NIF titular"):
                return True
            # Opción 3: fila sin clase odd/even (filas de tabla interior)
            clase = fila.get_attribute("class") or ""
            if clase == "" and len(celdas) == 1:
                return True
        except Exception:
            pass
        return False

    def parsear_detalle(fila_det):
        """Extrae NIF, nombre titular, dirección, teléfono, web y email.
        Funciona tanto con el outerHTML del tr principal como con celdas individuales.
        """
        datos = {"nif_titular": "", "nombre_titular": "", "direccion": "",
                 "telefono": "", "web": "", "email": ""}
        try:
            from bs4 import BeautifulSoup
            # Obtener el HTML completo de la fila de detalle
            html = fila_det.get_attribute("outerHTML")
            soup = BeautifulSoup(html, "html.parser")

            # Buscar en la tabla anidada .tablaDetalle
            filas_det = soup.select("table.tablaDetalle tr, table.marginDetailTabla tr")
            
            if not filas_det:
                # Fallback: leer texto directo de las celdas td
                texto_completo = soup.get_text(" ", strip=True)
                filas_texto = [l.strip() for l in texto_completo.split("\n") if l.strip()]
            else:
                filas_texto = [fr.get_text(" ", strip=True) for fr in filas_det]

            for texto in filas_texto:
                if not texto:
                    continue
                t = texto.strip()
                if "NIF titular" in t:
                    val = t.replace("NIF titular:", "").replace("NIF titular", "").strip().lstrip(":").strip()
                    datos["nif_titular"] = val if val not in ("-", "") else ""
                elif "Nombre del titular" in t:
                    val = t.replace("Nombre del titular:", "").replace("Nombre del titular", "").strip().lstrip(":").strip()
                    datos["nombre_titular"] = val if val not in ("-", "") else ""
                elif t.startswith("Direcci"):
                    val = t.split(":", 1)[-1].strip()
                    datos["direccion"] = val if val != "-" else ""
                elif t.startswith("Tel"):
                    val = t.split(":", 1)[-1].strip()
                    datos["telefono"] = val if val != "-" else ""
                elif "Sitio web" in t:
                    val = t.split(":", 1)[-1].strip()
                    datos["web"] = val if val != "-" else ""
                elif "Mail" in t:
                    val = t.split(":", 1)[-1].strip().lstrip(":").strip()
                    datos["email"] = val if val != "-" else ""
        except Exception:
            pass
        return datos

    while True:
        try:
            # Esperar tabla de entidades
            WebDriverWait(driver, 8).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "table tbody tr"))
            )

            # Expandir TODAS las filas de la página de golpe antes de leer
            btns = driver.find_elements(By.CSS_SELECTOR, "table tbody tr td .details-control")
            for btn in btns:
                try:
                    driver.execute_script("arguments[0].click();", btn)
                    time.sleep(0.15)
                except Exception:
                    pass
            time.sleep(0.8)  # Esperar que se expandan todas

            filas = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
            entidades_pag = []
            i = 0
            while i < len(filas):
                fila = filas[i]
                try:
                    if es_fila_detalle(fila):
                        i += 1
                        continue

                    celdas = fila.find_elements(By.TAG_NAME, "td")
                    # Fila principal tiene 5 celdas: btn-expand, id, nombre, tipo, provincia
                    if len(celdas) < 5:
                        i += 1
                        continue

                    entidad = {
                        "identificador":  celdas[1].text.strip(),
                        "nombre":         celdas[2].text.strip(),
                        "tipo":           celdas[3].text.strip(),
                        "provincia":      celdas[4].text.strip(),
                        "nif_titular":    "",
                        "nombre_titular": "",
                        "direccion":      "",
                        "telefono":       "",
                        "web":            "",
                        "email":          "",
                    }

                    # Leer fila de detalle (la siguiente)
                    if i + 1 < len(filas) and es_fila_detalle(filas[i + 1]):
                        detalle = parsear_detalle(filas[i + 1])
                        entidad.update(detalle)
                        i += 1  # Saltar la fila de detalle

                    if entidad["identificador"] or entidad["nombre"]:
                        entidades_pag.append(entidad)

                except StaleElementReferenceException:
                    pass

                i += 1

            todas.extend(entidades_pag)
            print(f"    Página {pagina}: {len(entidades_pag)} entidades")

            # Intentar siguiente página
            try:
                btn_sig = driver.find_element(By.CSS_SELECTOR,
                    ".paginate_button.next:not(.disabled), a.next:not(.disabled)"
                )
                if "disabled" in (btn_sig.get_attribute("class") or ""):
                    break
                btn_sig.click()
                time.sleep(1.5)
                pagina += 1
                if pagina > 100:
                    break
            except NoSuchElementException:
                break

        except TimeoutException:
            break
        except Exception as e:
            print(f"    ⚠️  Error extrayendo página {pagina}: {e}")
            break

    return todas


def cargar_codigos(path):
    if not os.path.exists(path):
        print(f"❌ No se encuentra {path}")
        return []
    with open(path, encoding="utf-8") as f:
        return [item["codigo"] for item in json.load(f)]


def cargar_previos(path):
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def guardar(path, resultados):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limite",    type=int, default=0)
    parser.add_argument("--continuar", action="store_true")
    parser.add_argument("--visible",   action="store_true")
    args = parser.parse_args()

    codigos   = cargar_codigos(INPUT_JSON)
    previos   = cargar_previos(OUTPUT_JSON) if args.continuar else {}
    if args.limite:
        codigos = codigos[:args.limite]

    pendientes = [c for c in codigos if c not in previos]
    total = len(pendientes)
    print(f"📋 Especialidades: {total} pendientes ({len(previos)} ya procesadas)")

    if total == 0:
        print("Nada que hacer.")
        return

    resultados = dict(previos)
    driver = crear_driver(headless=not args.visible)

    try:
        for i, codigo in enumerate(pendientes, 1):
            print(f"[{i}/{total}] {codigo}", end=" → ")

            id_interno = esperar_y_buscar(driver, codigo)

            if not id_interno:
                print("Sin resultado en buscador")
                resultados[codigo] = []
            else:
                print(f"ID interno: {id_interno}", end=" ")
                entidades = obtener_entidades(driver, id_interno)
                resultados[codigo] = entidades
                print(f"→ {len(entidades)} entidades")

            if i % 20 == 0:
                guardar(OUTPUT_JSON, resultados)
                print(f"  💾 Checkpoint: {len(resultados)} guardados")

            time.sleep(random.uniform(*DELAY))

    finally:
        driver.quit()

    guardar(OUTPUT_JSON, resultados)
    print(f"\n🏁 {len(resultados)} especialidades en '{OUTPUT_JSON}'")


if __name__ == "__main__":
    main()
