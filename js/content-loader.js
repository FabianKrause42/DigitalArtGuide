/**
 * CONTENT LOADER SYSTEM
 * =====================
 * Lädt Inhalte dynamisch aus separaten HTML-Dateien (screens/)
 * und triggert nahtlose Wipe-Animationen zwischen den Screens.
 * 
 * Architektur:
 * - index.html: Nur Struktur (Tab-Nav + Screen-Container)
 * - screens/: Einzelne Content-Dateien (home.html, scanner.html)
 * - screens/exhibitions/: Ausstellungs-Inhalte (exhibition-1.html, etc.)
 * 
 * URL-Parameter:
 * - /index.html?view=home (Standard)
 * - /index.html?view=scan
 * - /index.html?view=exhibition&id=1 (Ausstellung 1)
 */

class ContentLoader {
  constructor() {
    // Speichert den aktuell geladenen Screen
    this.currentScreen = null; // null = noch kein Screen geladen
    
    // Flag um mehrfache Animationen zu verhindern
    this.isAnimating = false;
    this.numberInputController = null;
    
    // Mapping: Screen-Namen zu ihren Content-Dateien
    this.screenPaths = {
      home: 'screens/home.html',
      scan: 'screens/scanner.html',
      number: 'screens/number.html',
      map: 'screens/lageplan.html',
      artworks: 'screens/artworks-list.html',
      'artwork-detail': 'screens/artwork-detail.html',
      exhibition: 'screens/exhibitions/exhibition-.html', // ID wird hinzugefügt
      // Später erweiterbar: map, about, etc.
    };

    this.init();
  }

  init() {
    this.loadScreenFromURL();
    this.setupTabListeners();
    
    window.addEventListener('popstate', () => {
      this.loadScreenFromURL();
    });
  }

  /**
   * Prüfe URL-Parameter (?view=...) und lade entsprechenden Screen
   */
  loadScreenFromURL() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') || 'home';
    const id = params.get('id') || null;
    const exhibition = params.get('exhibition') || null;
    const artwork = params.get('artwork') || null;

    // Lade Exhibition mit ID, oder normalen Screen
    if (view === 'exhibition' && id) {
      // Unterstütze beide Formate: "2" oder "ausstellung-2-slug"
      const numericId = this.extractNumericId(id);
      if (!isNaN(numericId) && numericId >= 1 && numericId <= 3) {
        this.loadExhibition(numericId);
      } else {
        console.error('Ungültige Exhibition ID in URL:', id);
        this.loadScreen('home');
      }
    } else if (view === 'artworks' && exhibition) {
      const exhibitionId = parseInt(exhibition);
      if (!isNaN(exhibitionId) && exhibitionId >= 1 && exhibitionId <= 3) {
        this.loadArtworksList(exhibitionId);
      } else {
        console.error('Ungültige Exhibition ID für Artworks:', exhibition);
        this.loadScreen('home');
      }
    } else if (view === 'artwork-detail' && exhibition && artwork) {
      const exhibitionId = parseInt(exhibition);
      if (!isNaN(exhibitionId) && exhibitionId >= 1 && exhibitionId <= 3) {
        this.loadArtworkDetail(exhibitionId, artwork);
      } else {
        console.error('Ungültige Exhibition ID für Artwork Detail:', exhibition);
        this.loadScreen('home');
      }
    } else {
      this.loadScreen(view);
    }
  }

  /**
   * Lade einen regulären Screen
   * @param {string} screenName - 'home', 'scan', etc.
   */
  loadScreen(screenName) {
    // Beim ersten Load (currentScreen ist null) trotzdem laden
    if (screenName === this.currentScreen && this.currentScreen !== null) return;
    if (this.isAnimating) return; // Keine Aktion während Animation läuft

    // Bestimme Animationsrichtung
    const isBackToHome = screenName === 'home';

    // Lade Content via AJAX
    const filePath = this.screenPaths[screenName];
    if (!filePath) {
      console.error(`Screen "${screenName}" nicht gefunden`);
      return;
    }

    this.loadContent(filePath, screenName, isBackToHome);
    
    // Update URL (damit Browser-Navigation funktioniert)
    history.pushState({ screen: screenName }, '', `?view=${screenName}`);
  }

  /**
   * Lade eine Ausstellung mit ID
   * @param {number} exhibitionId - 1, 2, oder 3
   * @param {boolean} isBackNavigation - true wenn zurück-Navigation von Artworks-Liste
   */
  loadExhibition(exhibitionId, isBackNavigation = false) {
    if (isNaN(exhibitionId) || exhibitionId < 1 || exhibitionId > 3) {
      console.error(`Exhibition ID ${exhibitionId} ungültig`);
      return;
    }

    this.isAnimating = true;
    const filePath = `Content/ausstellung-${exhibitionId}-${this.getExhibitionSlug(exhibitionId)}/exhibition${exhibitionId}.html`;
    const screenName = `exhibition${exhibitionId}`;

    // Bei Zurück-Navigation von links, sonst von rechts
    const isBackToHome = isBackNavigation;

    this.loadContent(filePath, screenName, isBackToHome);
    
    // Update URL
    history.pushState({ screen: screenName }, '', `?view=exhibition&id=${exhibitionId}`);
  }

  /**
   * Hole den Slug für eine Exhibition ID
   */
  getExhibitionSlug(exhibitionId) {
    const slugs = {
      1: 'OfOtherPlaces',
      2: 'VesselsOfUnbecoming',
      3: 'DenkeFreiSchaffeNeu'
    };
    return slugs[exhibitionId] || '';
  }

  /**
   * Extrahiere numerische ID aus String-Format
   * @param {string|number} id - "2" oder "ausstellung-2-slug"
   * @returns {number} - 2
   */
  extractNumericId(id) {
    if (typeof id === 'number') return id;
    // Versuche direkt zu parsen
    const direct = parseInt(id);
    if (!isNaN(direct)) return direct;
    // Extrahiere aus "ausstellung-2-slug" Format
    const match = id.match(/ausstellung-(\d+)-/);
    if (match) return parseInt(match[1]);
    return NaN;
  }

  /**
   * Lade Artworks-Liste für eine Ausstellung
   * @param {number} exhibitionId - 1, 2, oder 3
   */
  loadArtworksList(exhibitionId, isBackNavigation = false) {
    if (isNaN(exhibitionId) || exhibitionId < 1 || exhibitionId > 3) {
      console.error(`Exhibition ID ${exhibitionId} ungültig`);
      return;
    }

    this.isAnimating = true;
    const filePath = 'screens/artworks-list.html';
    const screenName = `artworks${exhibitionId}`;

    // Bei Zurück-Navigation von links, sonst von rechts
    const isBackToHome = isBackNavigation;

    this.loadContent(filePath, screenName, isBackToHome, { exhibitionId });
    
    // Update URL
    history.pushState({ screen: screenName, exhibitionId }, '', `?view=artworks&exhibition=${exhibitionId}`);
  }

  /**
   * Lade Content per AJAX und triggere Animation
   * @param {string} filePath - Pfad zur HTML-Datei
   * @param {string} screenName - Name des Screens (für Referenz)
   * @param {boolean} isBackToHome - Animation nach links oder rechts?
   * @param {Object} options - Zusätzliche Optionen (z.B. exhibitionId)
   */
  loadContent(filePath, screenName, isBackToHome, options = {}) {
    this.isAnimating = true;

    const screenContainer = document.querySelector('.screens-container');
    const currentScreenElement = document.querySelector('.screen.active');

    fetch(filePath)
      .then(response => {
        if (!response.ok) throw new Error(`Fehler beim Laden: ${filePath}`);
        return response.text();
      })
      .then(html => {
        const newScreen = document.createElement('div');
        newScreen.className = 'screen';
        newScreen.id = screenName;
        newScreen.innerHTML = html;

        // Speichere exhibitionId als data-attribute wenn vorhanden
        if (options.exhibitionId) {
          newScreen.dataset.exhibitionId = options.exhibitionId;
        }
        if (options.artworkId) {
          newScreen.dataset.artworkId = options.artworkId;
        }

        if (screenName.startsWith('exhibition')) {
          newScreen.classList.add('exhibition-screen');
        }

        // Bestimme Eintritts-Animation basierend auf Richtung
        if (!isBackToHome) {
          newScreen.classList.add('enter-right'); // Kommt von rechts (neue Page)
        } else {
          newScreen.classList.add('enter-left'); // Kommt von links (zurück)
        }

        // Füge neuen Screen zum DOM hinzu
        screenContainer.appendChild(newScreen);

        // Alte Screen ausblenden
        if (currentScreenElement) {
          currentScreenElement.classList.remove('active');
          if (isBackToHome) {
            currentScreenElement.classList.add('exit-right'); // Nach rechts raus (zurück)
          } else {
            currentScreenElement.classList.add('exit-left'); // Nach links raus (neue Page)
          }
        }

        // Update aktuelle Screen Referenz SOFORT
        this.currentScreen = screenName;

        // Neue Screen aktivieren (triggert CSS-Animation)
        // Erzwinge Reflow (Android/WebView) bevor 'active' gesetzt wird
        requestAnimationFrame(() => {
          void newScreen.offsetHeight; // forced reflow
          newScreen.classList.add('active');

          // Tab-Button Status aktualisieren
          this.updateTabButtons(screenName);
          
          // Features SOFORT nach active-class initialisieren (DOM ist jetzt bereit)
          this.reinitializeScreenFeatures(screenName);
        });

        // Cleanup nach Animation (entferne alte Screen aus DOM)
        // Dauer leicht über der CSS-Transition (350ms), um Android Timing-Issues zu vermeiden
        setTimeout(() => {
          if (currentScreenElement) {
            // Stoppe Kamera wenn Scan-Screen verlassen wird
            if (currentScreenElement.id === 'scan' && window.CameraController) {
              window.CameraController.stop();
            }
            currentScreenElement.remove();
          }
          newScreen.classList.remove('enter-right', 'enter-left');
          this.isAnimating = false;
        }, 400);
      })
      .catch(error => {
        console.error('ContentLoader Error:', error);
        this.isAnimating = false;
      });
  }

  /**
   * Setup Tab-Button Klick-Listener
   */
  setupTabListeners() {
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Lass Screen-Animation nicht zu, wenn gerade animiert
        if (this.isAnimating) return;

        const screenName = button.getAttribute('data-screen');

        // Lade Screen (setupSliderClicks wird automatisch in reinitializeScreenFeatures aufgerufen)
        this.loadScreen(screenName);
      });
    });
  }

  /**
   * Höre auf Klicks im Slider für Ausstellungen
   */
  setupSliderClicks() {
    const sliderItems = document.querySelectorAll('.slider-item');
    
    if (sliderItems.length === 0) {
      console.warn('⚠️ Keine Slider-Items gefunden');
      return;
    }

    const totalItems = sliderItems.length;
    const originalCount = totalItems - 2;
    
    sliderItems.forEach((item, index) => {
      item.style.cursor = 'pointer';
      
      item.addEventListener('click', () => {
        let exhibitionId;
        
        if (index === 0) {
          exhibitionId = originalCount;
        } else if (index === totalItems - 1) {
          exhibitionId = 1;
        } else {
          exhibitionId = index;
        }
        
        this.loadExhibition(exhibitionId);
      });
    });
  }

  /**
   * Update aktiven Tab-Button
   */
  updateTabButtons(screenName) {
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
      const buttonScreen = button.getAttribute('data-screen');
      if (buttonScreen === screenName.split(/\d/)[0]) { // Extrahiere Screen-Type
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  /**
   * Re-initialize Screen-spezifische Features
   * (z.B. Kamera für Scanner, Slider für Home, Back-Swipe für Exhibitions)
   */
  reinitializeScreenFeatures(screenName) {
    if (screenName === 'scan') {
      // Kamera starten - warte bis DOM bereit ist
      if (window.CameraController) {
        // requestAnimationFrame stellt sicher, dass Video-Element im DOM ist
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.CameraController.start();
          });
        });
      }
      // Right-Swipe zurück zu Home auf Scanner-Seite
      this.setupScanBackSwipe();
    } else if (screenName === 'home') {
      // Dynamischer Ausstellungs-Slider
      if (typeof ExhibitionSliderController !== 'undefined') {
        try {
          window.exhibitionSliderController = new ExhibitionSliderController();
          window.exhibitionSliderController.init();
        } catch (error) {
          console.error('❌ Slider Init Error:', error);
        }
      }
    } else if (screenName === 'number') {
      if (typeof NumberInputController !== 'undefined') {
        try {
          if (!this.numberInputController) {
            this.numberInputController = new NumberInputController();
          }
          this.numberInputController.init();
        } catch (error) {
          console.error('❌ Number Input Init Error:', error);
        }
      }
    } else if (screenName.startsWith('artworks')) {
      // Artworks List Controller initialisieren
      if (typeof ArtworksListController !== 'undefined') {
        try {
          const screenElement = document.querySelector('.screen.active');
          const exhibitionId = parseInt(screenElement.dataset.exhibitionId);
          if (exhibitionId) {
            const controller = new ArtworksListController();
            controller.init(exhibitionId);
          }
        } catch (error) {
          console.error('❌ Artworks List Init Error:', error);
        }
      }
      // Back-Swipe zur Exhibition
      this.setupArtworksBackSwipe();
    } else if (screenName.startsWith('artwork-detail')) {
      // Artwork Detail Controller initialisieren
      if (typeof ArtworkDetailController !== 'undefined') {
        try {
          const screenElement = document.querySelector('.screen.active');
          const exhibitionId = parseInt(screenElement.dataset.exhibitionId);
          const artworkId = screenElement.dataset.artworkId;
          if (exhibitionId && artworkId) {
            const controller = new ArtworkDetailController();
            controller.init(exhibitionId, artworkId);
          }
        } catch (error) {
          console.error('❌ Artwork Detail Init Error:', error);
        }
      }
      // Back-Swipe zur Artworks Liste
      this.setupArtworkDetailBackSwipe();
    } else if (screenName.startsWith('exhibition')) {
      // Exhibition Back-Swipe aktivieren
      this.setupExhibitionBackSwipe();
    }
  }

  /**
   * Aktiviert Right-Swipe auf der aktiven Scanner-Seite, um zur Home-Seite zu wechseln
   */
  setupScanBackSwipe() {
    const screenElement = document.querySelector('.screen.active');
    if (!screenElement) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e) => {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    };
    const onTouchMove = (e) => {
      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        e.preventDefault();
      }
    };
    const onTouchEnd = (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (dx > 80 && Math.abs(dx) > Math.abs(dy)) {
        this.loadScreen('home');
      }
    };

    // Entferne evtl. alte Listener (falls mehrfach init)
    screenElement.removeEventListener('touchstart', screenElement._scanTouchStart || (()=>{}));
    screenElement.removeEventListener('touchmove', screenElement._scanTouchMove || (()=>{}));
    screenElement.removeEventListener('touchend', screenElement._scanTouchEnd || (()=>{}));

    // Speichere Referenzen auf Element, um später entfernen zu können
    screenElement._scanTouchStart = onTouchStart;
    screenElement._scanTouchMove = onTouchMove;
    screenElement._scanTouchEnd = onTouchEnd;

    screenElement.addEventListener('touchstart', onTouchStart, { passive: true });
    screenElement.addEventListener('touchmove', onTouchMove, { passive: false });
    screenElement.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  /**
   * Setup Right-Swipe zum Zurückgehen von Exhibitions
   */
  setupExhibitionBackSwipe() {
    let touchStartX = 0;
    let touchStartY = 0;

    const screenElement = document.querySelector('.screen.active');
    if (!screenElement) return;

    screenElement.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });

    screenElement.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      // Horizontale Bewegung dominiert -> Scroll verhindern
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        e.preventDefault();
      }
    }, { passive: false });

    screenElement.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      // Right-Swipe: Zurück zur Startseite
      if (dx > 80 && Math.abs(dx) > Math.abs(dy)) {
        this.loadScreen('home');
      }
    }, { passive: true });
  }

  /**
   * Setup Right-Swipe zum Zurückgehen von Artworks-Liste zur Exhibition
   */
  setupArtworksBackSwipe() {
    let touchStartX = 0;
    let touchStartY = 0;

    const screenElement = document.querySelector('.screen.active');
    if (!screenElement) return;

    const exhibitionId = parseInt(screenElement.dataset.exhibitionId);

    screenElement.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });

    screenElement.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      // Horizontale Bewegung dominiert -> Scroll verhindern
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        e.preventDefault();
      }
    }, { passive: false });

    screenElement.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      // Right-Swipe: Zurück zur Exhibition
      if (dx > 80 && Math.abs(dx) > Math.abs(dy)) {
        if (exhibitionId) {
          this.loadExhibition(exhibitionId, true); // isBackNavigation = true
        }
      }
    }, { passive: true });
  }

  /**
   * Setup Right-Swipe zum Zurückgehen von Artwork-Detail zur Artworks-Liste
   */
  setupArtworkDetailBackSwipe() {
    let touchStartX = 0;
    let touchStartY = 0;

    const screenElement = document.querySelector('.screen.active');
    if (!screenElement) return;

    const exhibitionId = parseInt(screenElement.dataset.exhibitionId);

    screenElement.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });

    screenElement.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      // Horizontale Bewegung dominiert -> Scroll verhindern
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        e.preventDefault();
      }
    }, { passive: false });

    screenElement.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      // Right-Swipe: Zurück zur Artworks-Liste
      if (dx > 80 && Math.abs(dx) > Math.abs(dy)) {
        if (exhibitionId) {
          this.loadArtworksList(exhibitionId, true); // isBackNavigation = true
        }
      }
    }, { passive: true });
  }

  /**
   * Lade Artwork Detail Seite
   * @param {number} exhibitionId - ID der Ausstellung
   * @param {string} artworkId - ID des Artworks
   * @param {boolean} isBackNavigation - Ob es eine Zurück-Navigation ist
   */
  loadArtworkDetail(exhibitionId, artworkId, isBackNavigation = false) {
    if (this.isAnimating) return;

    const screenName = `artwork-detail-${exhibitionId}-${artworkId}`;
    const filePath = this.screenPaths['artwork-detail'];

    // Artwork-Detail kommt von rechts (neue Page), außer bei Zurück-Navigation
    const isBackToHome = isBackNavigation;

    this.loadContent(filePath, screenName, isBackToHome, { exhibitionId, artworkId });
    
    // Update URL
    history.pushState({ screen: screenName, exhibitionId, artworkId }, '', `?view=artwork-detail&exhibition=${exhibitionId}&artwork=${artworkId}`);
  }
}

// Initialisiere ContentLoader beim Page-Load
document.addEventListener('DOMContentLoaded', () => {
  window.contentLoader = new ContentLoader();
});
