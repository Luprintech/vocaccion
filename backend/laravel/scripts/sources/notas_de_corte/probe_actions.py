#!/usr/bin/env python3
"""
Investiga endpoints alternativos del QEDU para info general / rendimiento / insercion laboral.
Prueba distintos actions, URL patterns y parámetros.
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

# Probemos distintos actions en zona02 (la que sabemos que funciona)
print("=" * 70)
print("Probando actions distintos en zona02")
print("=" * 70)
actions = [
    "tarjeta", "detalle", "info", "informacion", "general",
    "rendimiento", "insercion", "insercionlaboral", "laboral",
    "estadisticas", "datos", "titulacion", "ficha",
]
for action in actions:
    payload = {
        "action": action,
        "offset": 0,
        "consulta": "periodismo",
        "niveles": "'GRADO'",
        "ambitos": "",
    }
    try:
        r = session.post(f"{base}/zona02/0", data=payload, timeout=15)
        r.encoding = "iso-8859-1"
        try:
            data = r.json()
            if isinstance(data, list) and data:
                keys = list(data[0].keys())
                print(f"  action={action!r:25s}: {len(data)} items | keys={keys}")
            else:
                print(f"  action={action!r:25s}: HTTP {r.status_code} | {str(data)[:100]}")
        except Exception:
            print(f"  action={action!r:25s}: HTTP {r.status_code} | {r.text[:80]}")
    except Exception as e:
        print(f"  action={action!r:25s}: ERROR {e}")
    time.sleep(0.3)

# Ahora probar con un cod_titulacion específico (de periodismo)
# Primero obtenemos un codTitula real
print()
print("=" * 70)
print("Obteniendo codTitula de 'periodismo' para hacer detalle...")
print("=" * 70)
r = session.post(f"{base}/zona02/0", data={
    "action": "tarjeta",
    "offset": 0,
    "consulta": "periodismo",
    "niveles": "'GRADO'",
    "ambitos": "",
}, timeout=15)
r.encoding = "iso-8859-1"
data = r.json()
if data:
    sample = data[0]
    cod_titula = sample.get("codTitula")
    cod_centro = sample.get("codCentro")
    cod_univ = sample.get("codUniv")
    print(f"  Titulación: {sample.get('titulacion')}")
    print(f"  codTitula={cod_titula}, codCentro={cod_centro}, codUniv={cod_univ}")
    print()
    
    # Probar distintas URLs con el código de titulación
    print("=" * 70)
    print(f"Probando URLs con codTitula={cod_titula}")
    print("=" * 70)
    
    # Patrón 1: zona0X/codTitula
    for zona in ["zona01", "zona02", "zona03", "zona04", "zona05"]:
        for suffix in [f"/{cod_titula}", f"/{cod_titula}/0", ""]:
            url = f"{base}/{zona}/0"
            payload2 = {
                "action": "tarjeta",
                "codTitula": cod_titula,
                "codCentro": cod_centro,
                "codUniv": cod_univ,
                "niveles": "'GRADO'",
            }
            try:
                r2 = session.post(url, data=payload2, timeout=10)
                r2.encoding = "iso-8859-1"
                if r2.status_code == 200:
                    try:
                        d2 = r2.json()
                        keys2 = list(d2[0].keys()) if isinstance(d2, list) and d2 else str(d2)[:80]
                        print(f"  POST {url} + codTitula: {len(d2) if isinstance(d2,list) else '?'} items | keys={keys2}")
                    except:
                        print(f"  POST {url} + codTitula: {r2.status_code} {r2.text[:80]}")
            except Exception as e:
                pass
    
    # Patrón 2: URL directa con codTitula en path
    print()
    print("Probando GET con codTitula en path...")
    for pattern in [
        f"{base}/zona01/{cod_titula}",
        f"{base}/zona03/{cod_titula}",
        f"{base}/zona04/{cod_titula}",
        f"https://www.ciencia.gob.es/home/qedu/titulacion/{cod_titula}",
        f"https://www.ciencia.gob.es/home/qedu/ficha/{cod_titula}",
        f"https://www.ciencia.gob.es/home/qedu/detalle/{cod_titula}",
    ]:
        try:
            r3 = session.get(pattern, timeout=10)
            r3.encoding = "iso-8859-1"
            if r3.status_code == 200:
                print(f"  GET {pattern}: {r3.status_code} | {r3.text[:120]}")
            else:
                print(f"  GET {pattern}: {r3.status_code}")
        except Exception as e:
            print(f"  GET {pattern}: ERROR {e}")
        time.sleep(0.2)
