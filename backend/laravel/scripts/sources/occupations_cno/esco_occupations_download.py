"""
descargar_esco.py
=================
Descarga todas las ocupaciones ESCO en español via API pública.
No requiere registro ni API key.

Uso:
    pip install requests
    python descargar_esco.py
"""

import requests
import json
import time

BASE = "https://ec.europa.eu/esco/api"
OUTPUT = "esco_ocupaciones_es.json"

def descargar_ocupaciones():
    ocupaciones = []
    offset = 0
    limit = 100
    total_esperado = None

    print("📥 Descargando ocupaciones ESCO v1.2 en español...")

    while True:
        params = {
            "type":            "occupation",
            "language":        "es",
            "limit":           limit,
            "offset":          offset,
            "full":            "true",
            "selectedVersion": "v1.2.0",
        }

        try:
            resp = requests.get(
                f"{BASE}/search",
                params=params,
                timeout=30,
                headers={"Accept": "application/json"}
            )
            resp.raise_for_status()
        except requests.RequestException as e:
            print(f"❌ Error en offset {offset}: {e}")
            break

        data = resp.json()

        # Extraer total en primera petición
        if offset == 0:
            total_esperado = data.get("total", "?")
            print(f"   Total ocupaciones en ESCO: {total_esperado}")

        # Extraer resultados
        resultados = (
            data.get("_embedded", {}).get("results", [])
            or data.get("results", [])
        )

        if not resultados:
            print(f"   Sin más resultados. Total descargadas: {len(ocupaciones)}")
            break

        ocupaciones.extend(resultados)
        print(f"   [{offset+len(resultados)}/{total_esperado}] {len(resultados)} ocupaciones")

        offset += limit

        # Parar si ya tenemos todo
        if total_esperado and len(ocupaciones) >= int(total_esperado):
            break

        if len(resultados) < limit:
            break

        time.sleep(0.5)  # Respetar la API

    return ocupaciones


def limpiar_ocupacion(raw):
    """Extrae los campos más útiles para Vocacción."""
    titulo = raw.get("title", "")
    if isinstance(titulo, dict):
        titulo = titulo.get("es", titulo.get("en", ""))

    descripcion = raw.get("description", {})
    if isinstance(descripcion, dict):
        descripcion = descripcion.get("es", {}).get("literal", "") or \
                      descripcion.get("en", {}).get("literal", "")

    alt_labels = raw.get("alternativeLabel", {})
    if isinstance(alt_labels, dict):
        alt_labels = alt_labels.get("es", []) or alt_labels.get("en", [])

    return {
        "uri":             raw.get("uri", ""),
        "codigo_esco":     raw.get("uri", "").split("/")[-1] if raw.get("uri") else "",
        "titulo":          titulo,
        "descripcion":     descripcion[:500] if descripcion else "",
        "etiquetas_alt":   alt_labels[:10] if isinstance(alt_labels, list) else [],
        "isco_group":      raw.get("iscoGroup", {}).get("code", "") if isinstance(raw.get("iscoGroup"), dict) else "",
        "url_esco":        raw.get("_links", {}).get("self", {}).get("href", ""),
    }


def main():
    ocupaciones_raw = descargar_ocupaciones()

    if not ocupaciones_raw:
        print("❌ No se descargó nada.")
        return

    # Limpiar y estructurar
    ocupaciones = [limpiar_ocupacion(o) for o in ocupaciones_raw]

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(ocupaciones, f, ensure_ascii=False, indent=2)

    print(f"\n✅ {len(ocupaciones)} ocupaciones guardadas en '{OUTPUT}'")
    print("\nEjemplo:")
    print(json.dumps(ocupaciones[0], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
