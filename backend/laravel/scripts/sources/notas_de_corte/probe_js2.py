#!/usr/bin/env python3
"""Analyze QEDU page to find JS endpoints for info/rendimiento/insercion."""
import requests, re, json

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://www.ciencia.gob.es/qedu.html",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "es-ES,es;q=0.9",
})

r = session.get("https://www.ciencia.gob.es/qedu.html", timeout=30)
html = r.text

# Save full page
with open("qedu_page.html", "w", encoding="utf-8", errors="replace") as f:
    f.write(html)

# Search for zona patterns
zona_refs = list(set(re.findall(r'zona\d+[^\s"\'<>]{0,80}', html, re.IGNORECASE)))
print("ZONA patterns:")
for z in sorted(zona_refs):
    print(f"  {z}")

print()
# Search for action patterns  
action_refs = list(set(re.findall(r'["\']action["\']\s*[,:]?\s*["\']([^"\']{3,30})["\']', html, re.IGNORECASE)))
print("ACTION values in HTML:")
for a in sorted(action_refs):
    print(f"  {a!r}")

print()
# Find URL patterns with /home/qedu/
url_patterns = list(set(re.findall(r'/home/qedu/[^\s"\'<>]{3,80}', html, re.IGNORECASE)))
print("URL patterns /home/qedu/:")
for u in sorted(url_patterns):
    print(f"  {u}")

print()
# Look for tab/section keywords
keywords = ['infoGeneral', 'rendimiento', 'insercion', 'laboral', 'zona01', 'zona03', 'zona04']
for kw in keywords:
    positions = [m.start() for m in re.finditer(re.escape(kw), html, re.IGNORECASE)]
    if positions:
        print(f"Keyword {kw!r}: {len(positions)} occurrences")
        # Show context of first occurrence
        pos = positions[0]
        context = html[max(0,pos-100):pos+200].replace('\n', ' ')
        print(f"  First context: ...{context}...")
        print()

print(f"Page size: {len(html)} chars. Saved to qedu_page.html")
