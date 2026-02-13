import json

with open('Content/ausstellung-1-OfOtherPlaces/artworks.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for artwork in data['artworks']:
    desc = artwork['description']
    breaks = desc.count('\\n')
    print(f"Artwork {artwork['id']}: {breaks} paragraph breaks")
