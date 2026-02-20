# Rollback Anleitung: iOS Safari Toolbar Fix

## Falls der Fix Probleme verursacht, diese Änderungen rückgängig machen:

### 1) In `css/styles.css` (Zeile ~176):

**ÄNDERN VON:**
```css
.screens-container {
  position: relative;
  flex: 1;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

**ZURÜCK ZU:**
```css
.screens-container {
  position: relative;
  flex: 1;
  width: 100%;
  overflow: hidden;
}
```

---

### 2) In `css/styles.css` (Zeile ~184):

**ÄNDERN VON:**
```css
.screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 100%;
  /* ... */
  overflow-y: visible;
  padding-top: 20px;
```

**ZURÜCK ZU:**
```css
.screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* ... */
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-top: 20px;
```

---

### 3) In `js/content-loader.js` (Zeile ~260):

**ENTFERNEN:**
```javascript
// Scroll-Position zurücksetzen (screens-container scrollt jetzt)
const screensContainer = document.querySelector('.screens-container');
if (screensContainer) {
  screensContainer.scrollTo({ top: 0, behavior: 'instant' });
}
```

---

## Git Rollback (alternativ):

```bash
# Aktuellen Stand sichern:
git add -A
git commit -m "Versuch: iOS Safari Toolbar Fix"

# Falls Rollback nötig:
git revert HEAD
```

---

## Geänderte Dateien:
- `css/styles.css` (2 Stellen)
- `js/content-loader.js` (1 Stelle)

**Gesamt: 3 kleine Änderungen, alle reversibel**
