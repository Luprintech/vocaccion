#!/usr/bin/env python3
"""Probe QEDU API zones to discover which zones contain which data."""
import requests, json

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://www.ciencia.gob.es/qedu.html",
    "Origin": "https://www.ciencia.gob.es",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "es-ES,es;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
})

base = "https://www.ciencia.gob.es/home/qedu/main"

# Payload que usamos para notas de corte (funciona en zona02)
payload_tarjeta = {
    "action": "tarjeta",
    "offset": 0,
    "consulta": "periodismo",
    "niveles": "'GRADO'",
    "ambitos": "",
}

# También probar action distinto
payload_detalle = {
    "action": "detalle",
    "offset": 0,
    "consulta": "periodismo",
    "niveles": "'GRADO'",
    "ambitos": "",
}

print("=" * 70)
print("Probando zonas con action=tarjeta")
print("=" * 70)
for zona in ["zona01", "zona02", "zona03", "zona04", "zona05", "zona06"]:
    url = f"{base}/{zona}/0"
    try:
        r = session.post(url, data=payload_tarjeta, timeout=20)
        r.encoding = "iso-8859-1"
        ct = r.headers.get("Content-Type", "")
        try:
            data = r.json()
            keys = list(data[0].keys()) if isinstance(data, list) and data else str(data)[:100]
            print(f"  {zona}: HTTP {r.status_code} | {len(data) if isinstance(data, list) else '?'} items | keys={keys}")
        except Exception:
            print(f"  {zona}: HTTP {r.status_code} | CT={ct[:40]} | body={r.text[:100]}")
    except Exception as e:
        print(f"  {zona}: ERROR {e}")

print()
print("=" * 70)
print("Probando zonas con action=detalle")
print("=" * 70)
for zona in ["zona01", "zona02", "zona03", "zona04", "zona05", "zona06"]:
    url = f"{base}/{zona}/0"
    try:
        r = session.post(url, data=payload_detalle, timeout=20)
        r.encoding = "iso-8859-1"
        ct = r.headers.get("Content-Type", "")
        try:
            data = r.json()
            keys = list(data[0].keys()) if isinstance(data, list) and data else str(data)[:100]
            print(f"  {zona}: HTTP {r.status_code} | {len(data) if isinstance(data, list) else '?'} items | keys={keys}")
        except Exception:
            print(f"  {zona}: HTTP {r.status_code} | CT={ct[:40]} | body={r.text[:100]}")
    except Exception as e:
        print(f"  {zona}: ERROR {e}")
