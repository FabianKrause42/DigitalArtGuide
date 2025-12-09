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
    
    // Mapping: Screen-Namen zu ihren Content-Dateien
    this.screenPaths = {
      home: 'screens/home.html',
      scan: 'screens/scanner.html',
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

    // Lade Exhibition mit ID, oder normalen Screen
    if (view === 'exhibition' && id) {
      this.loadExhibition(parseInt(id));
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
   */
  loadExhibition(exhibitionId) {
    if (exhibitionId < 1 || exhibitionId > 3) {
      console.error(`Exhibition ID ${exhibitionId} ungültig`);
      return;
    }

    this.isAnimating = true;
    const filePath = `screens/exhibitions/exhibition-${exhibitionId}.html`;
    const screenName = `exhibition${exhibitionId}`;

    // Exhibitions-Seiten kommen von rechts (neue Page)
    const isBackToHome = false;

    this.loadContent(filePath, screenName, isBackToHome);
    
    // Update URL
    history.pushState({ screen: screenName }, '', `?view=exhibition&id=${exhibitionId}`);
  }

  /**
   * Lade Content per AJAX und triggere Animation
   * @param {string} filePath - Pfad zur HTML-Datei
   * @param {string} screenName - Name des Screens (für Referenz)
   * @param {boolean} isBackToHome - Animation nach links oder rechts?
   */
  loadContent(filePath, screenName, isBackToHome) {
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
        // requestAnimationFrame stellt sicher dass DOM-Insert fertig ist
        requestAnimationFrame(() => {
          newScreen.classList.add('active');
          
          // Tab-Button Status aktualisieren
          this.updateTabButtons(screenName);
          
          // Features SOFORT nach active-class initialisieren (DOM ist jetzt bereit)
          this.reinitializeScreenFeatures(screenName);
        });

        // Cleanup nach Animation (entferne alte Screen aus DOM)
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
        }, 300);
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
      // Kamera starten
      if (window.CameraController) {
        window.CameraController.start();
      }
    } else if (screenName === 'home') {
      const sliderTrack = document.querySelector('.slider-track');
      
      if (!sliderTrack) {
        console.error('❌ Slider-Track not found');
        return;
      }
      
      if (typeof ImageSliderController !== 'undefined') {
        try {
          window.imageSliderController = new ImageSliderController(() => {
            this.setupSliderClicks();
          });
        } catch (error) {
          console.error('❌ Slider Init Error:', error);
        }
      }
    } else if (screenName.startsWith('exhibition')) {
      // Exhibition Back-Swipe aktivieren
      this.setupExhibitionBackSwipe();
    }
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
}

// Initialisiere ContentLoader beim Page-Load
document.addEventListener('DOMContentLoaded', () => {
  window.contentLoader = new ContentLoader();
});
