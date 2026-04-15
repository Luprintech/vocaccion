#!/usr/bin/env python3
"""
Fetch QEDU page JS to find how info general / rendimiento / insercion laboral are loaded.
"""
import requests, re

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://www.ciencia.gob.es/qedu.html",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "es-ES,es;q=0.9",
})

# Fetch main page
r = session.get("https://www.ciencia.gob.es/qedu.html", timeout=30)
html = r.text

# Find all JS script src references
js_refs = re.findall(r'<script[^>]+src=["\']([^"\']*qedu[^"\']*)["\']', html, re.IGNORECASE)
print(f"JS refs with 'qedu': {js_refs}")

# Find inline scripts with useful patterns
qedu_patterns = re.findall(r'qedu[^"\s<>]{0,100}', html, re.IGNORECASE)
print(f"\nPatterns with 'qedu' ({len(qedu_patterns)} found):")
for p in set(qedu_patterns)[:20]:
    print(f"  {p}")

# Find zona references
zona_refs = re.findall(r'zona\d+[^"\s<>]{0,80}', html, re.IGNORECASE)
print(f"\nzona refs ({len(zona_refs)}):")
for z in set(zona_refs)[:20]:
    print(f"  {z}")

# Find action references
action_refs = re.findall(r'action["\']?\s*[:=]\s*["\']([^"\']+)["\']', html, re.IGNORECASE)
print(f"\naction values found in HTML:")
for a in set(action_refs)[:20]:
    print(f"  {a!r}")

# Save full page for manual inspection
with open("qedu_page.html", "w", encoding="utf-8", errors="replace") as f:
    f.write(html)
print(f"\nFull page saved to qedu_page.html ({len(html)} chars)")
