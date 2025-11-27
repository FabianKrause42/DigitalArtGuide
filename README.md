# Digitaler Audioguide (PWA)

Kurzanleitung (Deutsch)

- Dateien liegen im Projektordner. Lege Audiodateien in `assets/audio/` ab (z. B. `artwork1.mp3`).
- Zum Testen lokal einen einfachen HTTP-Server verwenden (z. B. Python):

```powershell
# im Projektordner ausführen
python -m http.server 8000; Start-Process http://localhost:8000
```

- Öffne die Seite im Smartphone-Browser (oder im Desktop-Browser). Die PWA kann installiert werden (Add to Home Screen).
- Tippe auf das `⇩`-Symbol, um eine Audiodatei offline zu speichern (Service Worker lädt sie in den Cache).

Hinweise:
- iOS Safari hat Einschränkungen beim Caching und bei Hintergrund-Audio. Teste auf echten Geräten.
- Für QR- oder GPS-Funktionalität kann eine Erweiterung mit `navigator.geolocation` oder einer QR-Scanner-Bibliothek ergänzt werden.

Nächste Schritte (Vorschläge):
- UI verbessern, Player zentralisieren, Playlists und Resume-Funktion.
- Administrations-Backend zum Hochladen von Audios.
- Mehrsprachigkeit (DE/EN) und Metadaten (Künstler, Jahr).
