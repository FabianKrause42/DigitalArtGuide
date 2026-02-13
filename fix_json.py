import json
import os

# Fix artworks.json für Ausstellung 1
json_path = 'Content/ausstellung-1-OfOtherPlaces/artworks.json'

try:
    # Lese die Datei (trotz Fehler)
    with open(json_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse JSON
    data = json.loads(content)
    
    # Schreibe korrekt formatiert zurück
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Fixed {json_path}")
except Exception as e:
    print(f"❌ Error: {e}")
