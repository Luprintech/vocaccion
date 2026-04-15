# 🖥️ Comandos scraper Minube

## Ir a la carpeta
```
cd ~/Centros\ no\ universitarios\ scraper
```

---

## 👀 Ver progreso en tiempo real
```
tail -f log.txt
```
Salir sin parar el scraper: Ctrl + C

---

## ✅ Comprobar que sigue vivo
```
ps aux | grep scraper
```

---

## ⏸️ Parar
```
kill <PID>
```

---

## ▶️ Lanzar por primera vez
```
nohup python3 scraper_centros.py --todo-espana > log.txt 2>&1 &
```

---

## 🔁 Reanudar tras parar o reinicio del NAS
```
nohup python3 scraper_centros.py --todo-espana --continuar > log.txt 2>&1 &
```

---

## 📊 Ver cuántos centros lleva procesados
```
python3 -c "import json; d=json.load(open('centros_con_formaciones.json')); print(len(d), 'centros')"
```

---

## 📁 Ver JSONs por comunidad completados
```
ls -lh por_comunidad/
```
