#!/usr/bin/env python3
"""
Investiga qué devuelve action=detalle en zona02 con cod_titulacion.
Guarda la respuesta en un archivo para inspeccionar.
"""
import requests, json, time

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://www.ciencia.gob.es/qedu.html",
    "Origin": "https://www.ciencia.gob.es",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "es-ES,es;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
})

base = "https://www.ciencia.gob.es/home/qedu/main"

# 1. Obtenemos un codTitula real via action=tarjeta
r = session.post(f"{base}/zona02/0", data={
    "action": "tarjeta",
    "offset": 0,
    "consulta": "periodismo",
    "niveles": "'GRADO'",
    "ambitos": "",
}, timeout=20)
r.encoding = "iso-8859-1"
data = r.json()
sample = data[0]
cod_titula = sample["codTitula"]
cod_centro = sample["codCentro"]
cod_univ = sample["codUniv"]

print(f"Titulación: {sample['titulacion']}")
print(f"codTitula={cod_titula}, codCentro={cod_centro}, codUniv={cod_univ}")
print()

# 2. Probar action=detalle con distintos parámetros
test_payloads = [
    # Sin código específico (como tarjeta pero con detalle)
    {"action": "detalle", "offset": 0, "consulta": "periodismo", "niveles": "'GRADO'", "ambitos": ""},
    # Con codTitula
    {"action": "detalle", "codTitula": cod_titula, "niveles": "'GRADO'"},
    # Con todos los códigos
    {"action": "detalle", "codTitula": cod_titula, "codCentro": cod_centro, "codUniv": cod_univ},
    # Otros actions que podrían ser JSON
    {"action": "infoGeneral", "codTitula": cod_titula, "niveles": "'GRADO'"},
    {"action": "rendimiento", "codTitula": cod_titula, "niveles": "'GRADO'"},
    {"action": "insercion", "codTitula": cod_titula, "niveles": "'GRADO'"},
]

for i, payload in enumerate(test_payloads):
    action = payload.get("action", "?")
    r2 = session.post(f"{base}/zona02/0", data=payload, timeout=20)
    r2.encoding = "iso-8859-1"
    
    # Guardar respuesta cruda a archivo
    fname = f"probe_response_{i}_{action}.txt"
    with open(fname, "w", encoding="utf-8", errors="replace") as f:
        f.write(f"HTTP {r2.status_code}\n")
        f.write(f"Content-Type: {r2.headers.get('Content-Type','')}\n")
        f.write(f"Payload: {json.dumps(payload)}\n")
        f.write("=" * 60 + "\n")
        f.write(r2.text[:5000])
    
    # Intentar parsear como JSON
    try:
        j = r2.json()
        if isinstance(j, list) and j:
            keys = list(j[0].keys())
            with open(f"probe_json_{i}_{action}.json", "w", encoding="utf-8") as f:
                json.dump(j[:3], f, ensure_ascii=False, indent=2)
            print(f"[{i}] action={action}: JSON list, {len(j)} items, keys={keys}")
        elif isinstance(j, dict):
            print(f"[{i}] action={action}: JSON dict, keys={list(j.keys())}")
        else:
            print(f"[{i}] action={action}: JSON other type: {str(j)[:100]}")
    except Exception:
        content_preview = r2.text[:200].replace('\n', ' ')
        print(f"[{i}] action={action}: NOT JSON ({r2.status_code}) -> {content_preview}")
    
    time.sleep(0.5)

print()
print("Archivos guardados para inspección.")
