// Screen Navigation System mit korrekten Wipe-Animationen
// HINWEIS: Diese Klasse wird nicht mehr verwendet (content-loader.js übernimmt)
// Bleibt im Code für Rückwärtskompatibilität
class NavigationController {
  constructor() {
    this.currentScreen = 'home';
    this.screens = {}; // Leer, da Screens jetzt dynamisch geladen werden
    this.animating = false;
    console.log('⚠️ NavigationController ist deprecated, content-loader.js übernimmt');
  }

  init() {
    // Leer - content-loader übernimmt Navigation
  }

  navigateTo(screenName) {
    // Leer - content-loader übernimmt Navigation
  }

  activateScreen(screenName) {
    // Leer - content-loader übernimmt Navigation
  }

  updateTabButtons(activeScreen) {
    // Leer - content-loader übernimmt Navigation
  }
}

// Image Slider System mit Infinite Carousel (nahtlose Endlos-Schleife)
// Funktionsweise: Wir klonen das erste und letzte Bild, damit die Animation
// immer in die richtige Richtung läuft ohne "Zurückspringen".
// Struktur: [Bild3-Klon] [Bild1] [Bild2] [Bild3] [Bild1-Klon]
// Nach Animation zu einem Klon springen wir unsichtbar (ohne Transition) zur echten Position.
class ImageSliderController {
  constructor(onInitCallback = null) {
    try {
      this.sliderContainer = document.querySelector('.slider-container');
      this.sliderTrack = document.querySelector('.slider-track');
      this.sliderItems = Array.from(document.querySelectorAll('.slider-item'));
      this.dots = document.querySelectorAll('.dot');
      this.leftArrow = document.querySelector('.slider-arrow-left');
      this.rightArrow = document.querySelector('.slider-arrow-right');
      this.totalItems = this.sliderItems.length;
      this.currentIndex = 0;
      this.autoPlayInterval = null;
      this.isTransitioning = false;
      this.onInitCallback = onInitCallback;
      this.init();
    } catch (error) {
      console.error('❌ ImageSlider Error:', error);
      throw error;
    }
  }

  init() {
    // Kein Item? dann abbrechen
    if (this.totalItems === 0) {
      console.warn('⚠️ Kein Slider-Item gefunden, Slider wird übersprungen');
      return;
    }

    const hasMultiple = this.totalItems > 1;

    // Nur klonen wenn es mehr als ein Item gibt
    if (hasMultiple) {
      this.createClones();
      this.setPosition(1, false);
    } else {
      this.setPosition(0, false);
    }

    this.leftArrow.addEventListener('click', () => {
      this.prev();
      this.resetAutoPlay();
    });
    this.rightArrow.addEventListener('click', () => {
      this.next();
      this.resetAutoPlay();
    });

    this.setupTouchEvents();
    this.updateDots();

    // Autoplay nur wenn mehr als ein Item existiert
    if (hasMultiple) {
      this.startAutoPlay();
    }

    // Callback aufrufen wenn Init fertig
    if (this.onInitCallback && typeof this.onInitCallback === 'function') {
      this.onInitCallback();
    }
  }

  createClones() {
    // Sicherstellen, dass es mindestens 2 Items gibt
    if (!this.sliderItems || this.totalItems <= 1) {
      return; // Kein Klonen nötig/ möglich
    }

    // Letztes Bild klonen und VOR das erste setzen
    const firstClone = this.sliderItems[this.totalItems - 1].cloneNode(true);
    this.sliderTrack.insertBefore(firstClone, this.sliderItems[0]);
    
    // Erstes Bild klonen und NACH das letzte setzen
    const lastClone = this.sliderItems[0].cloneNode(true);
    this.sliderTrack.appendChild(lastClone);
  }

  next() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.currentIndex++;
    this.setPosition(this.currentIndex + 1, true); // +1 wegen des ersten Klons

    // Wenn wir beim letzten Klon sind, springe unsichtbar zum ersten echten Bild
    setTimeout(() => {
      if (this.currentIndex >= this.totalItems) {
        this.currentIndex = 0;
        this.setPosition(1, false); // Ohne Transition zurück zum Start
      }
      this.isTransitioning = false;
    }, 300); // Nach der Transition-Dauer
  }

  prev() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.currentIndex--;
    this.setPosition(this.currentIndex + 1, true); // +1 wegen des ersten Klons

    // Wenn wir beim ersten Klon sind, springe unsichtbar zum letzten echten Bild
    setTimeout(() => {
      if (this.currentIndex < 0) {
        this.currentIndex = this.totalItems - 1;
        this.setPosition(this.totalItems, false); // Ohne Transition zum Ende
      }
      this.isTransitioning = false;
    }, 300); // Nach der Transition-Dauer
  }

  setPosition(index, animate = true) {
    // Position berechnen: -index * 100%
    const offset = -index * 100;
    
    if (animate) {
      this.sliderTrack.style.transition = 'transform 0.3s ease';
    } else {
      this.sliderTrack.style.transition = 'none';
    }
    
    this.sliderTrack.style.transform = `translateX(${offset}%)`;
    this.updateDots();
  }

  updateDots() {
    // Dot-Indikatoren basierend auf logischem Index (0, 1, 2)
    const dotIndex = ((this.currentIndex % this.totalItems) + this.totalItems) % this.totalItems;
    this.dots.forEach((dot, index) => {
      if (index === dotIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.next();
    }, 5000); // Alle 5 Sekunden
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  resetAutoPlay() {
    // Auto-Play zurücksetzen bei manueller Interaktion
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  setupTouchEvents() {
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;

    const target = this.sliderContainer || this.sliderTrack;

    target.addEventListener('touchstart', (e) => {
      const touch = e.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      isSwiping = false;
    }, { passive: true });

    target.addEventListener('touchmove', (e) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      // Horizontaler Swipe dominiert -> Scroll verhindern (wichtig für iOS Safari)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        isSwiping = true;
        e.preventDefault();
      }
    }, { passive: false });

    const onEnd = (touch) => {
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      // Nur auslösen, wenn horizontaler Swipe dominiert
      if (isSwiping && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) {
          this.next();
        } else {
          this.prev();
        }
        this.resetAutoPlay();
      }
    };

    target.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      onEnd(touch);
    }, { passive: true });

    target.addEventListener('touchcancel', (e) => {
      const touch = e.changedTouches[0];
      onEnd(touch);
    }, { passive: true });
  }

  bindItemClicks() {
    /**
     * Slider-Items zu Ausstellungen verbinden
     * Klick triggert URL-Parameter, content-loader kümmert sich um den Rest
     */
    this.sliderItems.forEach((item, index) => {
      item.style.cursor = 'pointer';
      
      // Entferne alte Listener durch Node-Klonen
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
      
      // Neuer Listener mit URL-Navigation
      newItem.addEventListener('click', () => {
        const exhibitionId = index + 1;
        // content-loader liest diese URL-Parameter und lädt den entsprechenden Screen
        window.location.href = `?view=exhibition&id=${exhibitionId}`;
      });
    });
  }
}

// Exhibition Slider Controller - lädt Ausstellungen dynamisch aus exhibitions.json
class ExhibitionSliderController {
  constructor() {
    this.sliderTrack = null;
    this.sliderContainer = null;
    this.slider = null;
    this.exhibitions = [];
    this.currentIndex = 0;
    this.isTransitioning = false;
  }

  // Lade exhibitions.json und baue Slider dynamisch auf
  async init() {
    try {
      // Warte bis DOM ready ist
      if (!document.querySelector('.slider-track')) {
        console.log('⏳ Warte auf .slider-track...');
        await new Promise(resolve => {
          const checkDom = () => {
            if (document.querySelector('.slider-track')) {
              resolve();
            } else {
              setTimeout(checkDom, 50);
            }
          };
          checkDom();
        });
      }

      this.sliderTrack = document.querySelector('.slider-track');
      this.sliderContainer = document.querySelector('.slider-container');

      // Lade exhibitions.json
      const response = await fetch('Content/exhibitions.json');
      this.exhibitions = await response.json();
      console.log('✅ Ausstellungen geladen:', this.exhibitions.length);

      // Baue Slider dynamisch auf
      this.buildSlider();

      // Initialisiere ImageSliderController (von navigation.js)
      this.slider = new ImageSliderController(() => {
        console.log('✅ ImageSlider initialisiert');
      });

    } catch (error) {
      console.error('❌ ExhibitionSlider Error:', error);
    }
  }

  // Baue Slider-Items aus exhibitions.json
  buildSlider() {
    // Leere slider-track
    this.sliderTrack.innerHTML = '';

    // Erstelle Slider-Items für jede Ausstellung
    this.exhibitions.forEach((exhibition, index) => {
      const item = document.createElement('div');
      item.className = 'slider-item';
      item.dataset.id = exhibition.id;
      item.dataset.index = index;
      item.innerHTML = `<img src="${exhibition.cover}" alt="${exhibition.title}">`;
      
      // Click-Handler: Navigiere zur Ausstellungsseite
      item.addEventListener('click', () => {
        this.navigateToExhibition(exhibition);
      });
      
      this.sliderTrack.appendChild(item);
    });

    // Erstelle Dots dynamisch
    const dotsContainer = document.querySelector('.slider-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      this.exhibitions.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = 'dot';
        if (index === 0) dot.classList.add('active');
        dot.dataset.index = index;
        dotsContainer.appendChild(dot);
      });
    }

    console.log('✅ Slider-Items und Dots erstellt');
  }

  // Navigiere zur Ausstellungsseite
  navigateToExhibition(exhibition) {
    console.log('🎨 Navigiere zu:', exhibition.title);
    if (!exhibition.page) return;

    // Wenn ContentLoader existiert, nutze dessen Animation/History-Logik
    if (window.contentLoader && typeof window.contentLoader.loadContent === 'function') {
      const screenName = `exhibition-${exhibition.id}`;
      window.contentLoader.loadContent(exhibition.page, screenName, false);
      history.pushState({ screen: screenName }, '', `?view=exhibition&id=${exhibition.id}`);
      return;
    }

    // Fallback: Direktes Laden in currentScreen
    const screenContainer = document.querySelector('#currentScreen');
    if (screenContainer) {
      fetch(exhibition.page)
        .then(response => response.text())
        .then(html => {
          screenContainer.innerHTML = html;
          console.log('✅ Ausstellungsseite geladen (Fallback):', exhibition.title);
        })
        .catch(error => {
          console.error('❌ Fehler beim Laden der Ausstellungsseite:', error);
        });
    }
  }

  // Hilfsmethode: Hole Ausstellung per ID
  getExhibitionById(id) {
    return this.exhibitions.find(ex => ex.id === id);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const setDisplayModeClass = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    document.body.classList.toggle('display-standalone', isStandalone);
    document.body.classList.toggle('display-browser', !isStandalone);
  };

  setDisplayModeClass();
  const displayModeQuery = window.matchMedia('(display-mode: standalone)');
  displayModeQuery.addEventListener('change', setDisplayModeClass);

  // NavigationController deprecated - content-loader übernimmt
  // ImageSliderController wird vom content-loader initialisiert

  // Starte ExhibitionSlider
  const exhibitionSlider = new ExhibitionSliderController();
  exhibitionSlider.init().then(() => {
    console.log('✅ ExhibitionSlider initialisiert');
  }).catch(error => {
    console.error('❌ ExhibitionSlider init failed:', error);
  });
});
