// Screen Navigation System mit korrekten Wipe-Animationen
class NavigationController {
  constructor() {
    this.currentScreen = 'home';
    this.screens = {
      home: document.getElementById('homeScreen'),
      scan: document.getElementById('scanScreen'),
      map: null, // Placeholder für zukünftige Screens
      nummer: null,
    };
    this.animating = false;
    this.init();
  }

  init() {
    // Alle Tab-Buttons finden
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        if (this.animating) return; // Keine Animation während Animation läuft
        const targetScreen = button.getAttribute('data-screen');
        this.navigateTo(targetScreen);
      });
    });

    // Initial: Home-Screen aktivieren
    this.activateScreen('home');
  }

  navigateTo(screenName) {
    // Noch nicht implementierte Screens ignorieren
    if (!this.screens[screenName] || this.animating) {
      return;
    }

    // Wenn schon auf diesem Screen, nichts tun
    if (this.currentScreen === screenName) {
      return;
    }

    this.animating = true;
    const currentScreenElement = this.screens[this.currentScreen];
    const targetScreenElement = this.screens[screenName];
    const isBackToHome = screenName === 'home';

    // Aktuelle Screen vorbereiten für Exit
    if (currentScreenElement) {
      currentScreenElement.classList.remove('active');
      // Exit-Animation: Nach links wenn zu neuer Seite, nach rechts wenn zurück zur Home
      if (isBackToHome) {
        currentScreenElement.classList.add('exit-right');
      } else {
        currentScreenElement.classList.add('exit-left');
      }
    }

    // Neue Screen vorbereiten und einblenden
    if (targetScreenElement) {
      // Neu reinkommende Screen startet immer von rechts (wenn nicht Home)
      // oder von links (wenn zurück zur Home)
      if (!isBackToHome) {
        targetScreenElement.classList.add('enter-right');
      } else {
        targetScreenElement.classList.add('enter-left');
      }
      
      targetScreenElement.classList.remove('exit-left', 'exit-right');
      targetScreenElement.classList.add('active');
      
      // Tab-Button Status sofort aktualisieren
      this.updateTabButtons(screenName);
      this.currentScreen = screenName;
      
      // Cleanup nach Animation
      setTimeout(() => {
        if (currentScreenElement) {
          currentScreenElement.classList.remove('exit-left', 'exit-right');
        }
        this.animating = false;
      }, 300);
    }
  }

  activateScreen(screenName) {
    const screenElement = this.screens[screenName];
    if (screenElement) {
      screenElement.classList.add('active');
      this.currentScreen = screenName;
      this.updateTabButtons(screenName);
    }
  }

  updateTabButtons(activeScreen) {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      const buttonScreen = button.getAttribute('data-screen');
      if (buttonScreen === activeScreen) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }
}

// Image Slider System mit Infinite Carousel (nahtlose Endlos-Schleife)
// Funktionsweise: Wir klonen das erste und letzte Bild, damit die Animation
// immer in die richtige Richtung läuft ohne "Zurückspringen".
// Struktur: [Bild3-Klon] [Bild1] [Bild2] [Bild3] [Bild1-Klon]
// Nach Animation zu einem Klon springen wir unsichtbar (ohne Transition) zur echten Position.
class ImageSliderController {
  constructor() {
    this.sliderTrack = document.querySelector('.slider-track');
    this.sliderItems = Array.from(document.querySelectorAll('.slider-item'));
    this.dots = document.querySelectorAll('.dot');
    this.leftArrow = document.querySelector('.slider-arrow-left');
    this.rightArrow = document.querySelector('.slider-arrow-right');
    this.totalItems = this.sliderItems.length; // Originale Anzahl (3 Bilder)
    this.currentIndex = 0; // Logischer Index (0, 1, 2)
    this.autoPlayInterval = null;
    this.isTransitioning = false;
    this.init();
  }

  init() {
    // Klone erstellen für nahtlosen Loop
    this.createClones();
    
    // Start-Position: Auf dem ersten echten Bild (nach dem letzten Klon)
    this.setPosition(1, false); // Index 1 = erstes echtes Bild

    // Arrow-Button Events
    this.leftArrow.addEventListener('click', () => {
      this.prev();
      this.resetAutoPlay();
    });
    this.rightArrow.addEventListener('click', () => {
      this.next();
      this.resetAutoPlay();
    });

    // Touch-Swipe Support
    this.setupTouchEvents();

    // Initial: Ersten Dot aktivieren
    this.updateDots();

    // Auto-Play starten (alle 5 Sekunden)
    this.startAutoPlay();
  }

  createClones() {
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
    let touchEndX = 0;

    this.sliderTrack.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.sliderTrack.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
    }, { passive: true });
  }

  handleSwipe(startX, endX) {
    const swipeThreshold = 50; // Minimale Swipe-Distanz
    const diff = startX - endX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left -> next
        this.next();
      } else {
        // Swipe right -> prev
        this.prev();
      }
      // Auto-Play nach Swipe zurücksetzen
      this.resetAutoPlay();
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.navigationController = new NavigationController();
  window.imageSliderController = new ImageSliderController();
  
  console.log('✅ Navigation & Slider initialized');
});
