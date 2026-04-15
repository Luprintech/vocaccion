import json
import time
import requests
import mysql.connector

def geocode_spain():
    try:
        conn = mysql.connector.connect(
            host='127.0.0.1',
            user='root',
            password='',
            database='vocaccion'
        )
        cursor = conn.cursor(dictionary=True)
        
        # Get unique municipalities and provinces
        cursor.execute("SELECT DISTINCT municipality, province FROM official_centers WHERE municipality IS NOT NULL")
        locations = cursor.fetchall()
        
        headers = {
            'User-Agent': 'VocaccionApp/1.0 (contact@vocaccion.es)'
        }
        
        coords_cache = {}
        
        for loc in locations:
            municipality = loc['municipality']
            province = loc['province']
            
            # Simple sanitization
            if not municipality or not province:
                continue
                
            query = f"{municipality}, {province}, España"
            print(f"Geocoding: {query}...")
            
            try:
                # Nominatim API
                url = "https://nominatim.openstreetmap.org/search"
                params = {
                    'q': query,
                    'format': 'json',
                    'limit': 1
                }
                
                response = requests.get(url, headers=headers, params=params)
                data = response.json()
                
                if data and len(data) > 0:
                    lat = float(data[0]['lat'])
                    lng = float(data[0]['lon'])
                    coords_cache[(municipality, province)] = (lat, lng)
                    print(f"  -> Found: {lat}, {lng}")
                else:
                    # Fallback to just province if municipality not found
                    print(f"  -> Not found. Trying province: {province}, España")
                    params['q'] = f"{province}, España"
                    response = requests.get(url, headers=headers, params=params)
                    data = response.json()
                    
                    if data and len(data) > 0:
                        lat = float(data[0]['lat'])
                        lng = float(data[0]['lon'])
                        coords_cache[(municipality, province)] = (lat, lng)
                        print(f"  -> Found (fallback): {lat}, {lng}")
                    else:
                        print("  -> Still not found.")
                
                # Respect Nominatim limits (1 request per second)
                time.sleep(1.2)
                
            except Exception as e:
                print(f"Error requesting API: {e}")
                time.sleep(2)
        
        # Update the database
        update_count = 0
        for (m, p), (lat, lng) in coords_cache.items():
            # Add a tiny random offset so markers in the same municipality don't completely overlap perfectly
            # 0.005 degrees is roughly 500 meters
            cursor.execute("SELECT id FROM official_centers WHERE municipality = %s AND province = %s", (m, p))
            center_ids = cursor.fetchall()
            
            import random
            for center in center_ids:
                lat_offset = lat + random.uniform(-0.01, 0.01)
                lng_offset = lng + random.uniform(-0.01, 0.01)
                cursor.execute(
                    "UPDATE official_centers SET lat = %s, lng = %s WHERE id = %s", 
                    (lat_offset, lng_offset, center['id'])
                )
                update_count += 1
                
        conn.commit()
        print(f"Geocoding complete. Updated {update_count} centers with real municipality coordinates.")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == '__main__':
    geocode_spain()