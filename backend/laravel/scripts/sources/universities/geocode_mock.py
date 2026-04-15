import mysql.connector
import random
import os

# Spain bounding box roughly: lat 36.0 to 43.8, lng -9.0 to 3.0
def mock_geocoding():
    try:
        conn = mysql.connector.connect(
            host='127.0.0.1',
            user='root',
            password='',
            database='vocaccion'
        )
        cursor = conn.cursor(dictionary=True)
        
        # Get centers without coordinates
        cursor.execute("SELECT id FROM official_centers WHERE lat IS NULL")
        centers = cursor.fetchall()
        
        count = 0
        for center in centers:
            # Generate random coords in Spain
            lat = round(random.uniform(36.0, 43.8), 6)
            lng = round(random.uniform(-9.0, 3.0), 6)
            
            cursor.execute("UPDATE official_centers SET lat = %s, lng = %s WHERE id = %s", (lat, lng, center['id']))
            count += 1
            
        conn.commit()
        print(f"Mocked coordinates for {count} centers.")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    mock_geocoding()