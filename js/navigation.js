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

// Image Slider System
class ImageSliderController {
  constructor() {
    this.currentIndex = 0;
    this.sliderTrack = document.querySelector('.slider-track');
    this.sliderItems = document.querySelectorAll('.slider-item');
    this.dots = document.querySelectorAll('.dot');
    this.leftArrow = document.querySelector('.slider-arrow-left');
    this.rightArrow = document.querySelector('.slider-arrow-right');
    this.totalItems = this.sliderItems.length;
    this.init();
  }

  init() {
    // Arrow-Button Events
    this.leftArrow.addEventListener('click', () => this.prev());
    this.rightArrow.addEventListener('click', () => this.next());

    // Touch-Swipe Support (optional)
    this.setupTouchEvents();

    // Initial: Ersten Dot aktivieren
    this.updateView();
  }

  next() {
    if (this.currentIndex < this.totalItems - 1) {
      this.currentIndex++;
      this.updateView();
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateView();
    }
  }

  goToSlide(index) {
    if (index >= 0 && index < this.totalItems) {
      this.currentIndex = index;
      this.updateView();
    }
  }

  updateView() {
    // Slider verschieben (translateX)
    const offset = -this.currentIndex * 100;
    this.sliderTrack.style.transform = `translateX(${offset}%)`;

    // Dot-Indikatoren aktualisieren
    this.dots.forEach((dot, index) => {
      if (index === this.currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Arrow-Buttons enable/disable (optional)
    this.leftArrow.style.opacity = this.currentIndex === 0 ? '0.3' : '0.7';
    this.rightArrow.style.opacity = this.currentIndex === this.totalItems - 1 ? '0.3' : '0.7';
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
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.navigationController = new NavigationController();
  window.imageSliderController = new ImageSliderController();
  
  console.log('✅ Navigation & Slider initialized');
});
