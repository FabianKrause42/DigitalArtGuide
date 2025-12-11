# Datenstruktur für Ausstellungen

## Ordneraufbau

```
Content/
  ausstellung-1-beispiel/
    ├── info.json                 # Admin-Metadaten (nicht im Live-Betrieb)
    ├── artworks.json             # Alle Exponate dieser Ausstellung
    └── media/
        ├── images/               # Alle Bilder
        │   ├── thumb-001.jpg     # Thumbnail für Listen
        │   ├── artwork-001-01.jpg
        │   └── artwork-001-02.jpg
        └── audio/                # Audioguides (optional)
            ├── artwork-001-de.mp3
            └── artwork-001-en.mp3
  ausstellung-2-urban-forms/
    ├── info.json
    ├── artworks.json
    └── media/...
```

## Dateiformat: `artworks.json`

### Struktur
```json
{
  "exhibition": {
    "id": "ausstellung-1-beispiel",
    "title": "Licht und Schatten",
    "year": 2025
  },
  "artworks": [
    {
      "id": "001",                           // Eindeutige ID (wird für URLs genutzt)
      "number": "01",                        // Nummernfeld (2-3-stellig, wiederverwendbar)
      "title": "Refraction I",               // Titel des Exponats
      "artist": "Max Beispiel",              // Künstlername
      "artistBorn": 1985,                    // Geburtsyahr (optional, null wenn unbekannt)
      "artistDied": null,                    // Todesjahr (optional, null wenn noch lebend)
      "year": 2024,                          // Entstehungsjahr
      "materials": "Glas, LED-Licht, Stahl",// Material-Beschreibung
      "description": "...",                  // Ausführliche Beschreibung
      "images": [                            // Array mit 2-5 Bildern
        "media/images/artwork-001-01.jpg",
        "media/images/artwork-001-02.jpg"
      ],
      "thumbnail": "media/images/thumb-001.jpg",  // Für Listen/Suchergebnisse
      "audio": {                             // Audioguides (optional)
        "de": "media/audio/artwork-001-de.mp3",   // deutsch
        "en": null                                 // englisch (kann null sein)
      }
    }
  ]
}
```

### Feld-Regeln
| Feld | Typ | Pflicht | Besonderheit |
|------|-----|---------|--------------|
| `id` | string | ✅ | Eindeutig pro Ausstellung, z.B. "001", "artist-bio" |
| `number` | string | ✅ | 2-3-stellig, Nutzer-Input für Suche (wiederverwendbar!) |
| `title` | string | ✅ | Titel des Exponats |
| `artist` | string | ✅ | Künstlername |
| `artistBorn` | number oder null | ❌ | Nur wenn bekannt |
| `artistDied` | number oder null | ❌ | Nur wenn verstorben |
| `year` | number | ✅ | Entstehungsjahr |
| `materials` | string | ❌ | Kann leer sein, falls nicht relevant |
| `description` | string | ✅ | Erklärtext |
| `images` | array | ✅ | 2-5 Bilder, relativ zu `artworks.json` |
| `thumbnail` | string | ✅ | Quadrat für Listen (mind. 300x300px empfohlen) |
| `audio.de` | string oder null | ❌ | Optional pro Exponat |
| `audio.en` | string oder null | ❌ | Optional pro Exponat |

## Dateiformat: `info.json`

Admin-Überblick (nicht im Live-Betrieb genutzt):
```json
{
  "title": "Licht und Schatten",
  "date": "10.01.2025 – 30.03.2025",
  "artists": "Max Beispiel, Elena Schatten, Hans Monochrom",
  "description": "Kurze Ausstellungsbeschreibung..."
}
```

## Nutzung in der App

### 1. **Exponat-Suche (Nummernfeld)**
- Nutzer gibt z.B. "01" ein
- App sucht in `artworks.json` nach `number: "01"`
- Zeigt Thumbnail + Titel + Künstler

### 2. **Exponat-Detailseite (dynamisch)**
- Lädt komplette Daten aus `artworks.json`
- Baut Seite mit Slider (images), Titel, Künstler, Material, Audio
- Flexibel: Falls `artistDied` null, wird "noch lebend" / kein Todesjahr angezeigt

### 3. **Künstler-Seite (HTML-basiert)**
- Separate HTML-Datei pro Künstler (z.B. `artist-max-beispiel.html`)
- Verlinkt von Ausstellungs-Seite
- Wird manuell geschrieben (später: Biografie, Werke, etc.)

## Naming-Konventionen

- **Ausstellungs-Ordner:** `ausstellung-X-[slug]` (z.B. `ausstellung-1-licht-und-schatten`)
- **Bilder:** `artwork-[id]-[nummer].jpg` (z.B. `artwork-001-01.jpg`)
- **Thumbnails:** `thumb-[id].jpg`
- **Audioguides:** `artwork-[id]-[sprache].mp3` (z.B. `artwork-001-de.mp3`)

## Tipps für die Zukunft

- **Archive:** Bei alten Ausstellungen: Ordner aus `Content/` in `Archive/` verschieben
- **Nummern-Pool:** Nummern sind ausstellungsübergreifend. Übersicht in separater Datei empfohlen (z.B. `numbers-used.txt`)
- **Bilder-Größen:** Thumbnails ~300x300px, Detail-Bilder min. 800px Breite (für Slider)
