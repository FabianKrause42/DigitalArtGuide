// Screen Navigation System
class NavigationController {
  constructor() {
    this.currentScreen = 'home';
    this.screens = {
      home: document.getElementById('homeScreen'),
      scan: document.getElementById('scanScreen'),
      map: null, // Placeholder für zukünftige Screens
      menu: null
    };
    this.init();
  }

  init() {
    // Alle Tab-Buttons finden
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const targetScreen = button.getAttribute('data-screen');
        this.navigateTo(targetScreen);
      });
    });

    // Initial: Home-Screen aktivieren
    this.activateScreen('home');
  }

  navigateTo(screenName) {
    // Noch nicht implementierte Screens ignorieren
    if (!this.screens[screenName]) {
      console.log(`Screen "${screenName}" noch nicht implementiert`);
      return;
    }

    // Wenn schon auf diesem Screen, nichts tun
    if (this.currentScreen === screenName) {
      return;
    }

    const currentScreenElement = this.screens[this.currentScreen];
    const targetScreenElement = this.screens[screenName];

    // Transition: Current Screen ausblenden
    if (currentScreenElement) {
      currentScreenElement.classList.remove('active');
      currentScreenElement.classList.add('exit-left');
    }

    // Transition: Target Screen einblenden
    if (targetScreenElement) {
      // Kurzer Delay für smooth transition
      setTimeout(() => {
        targetScreenElement.classList.remove('enter-right');
        targetScreenElement.classList.add('active');
        this.currentScreen = screenName;
        
        // Tab-Button Status aktualisieren
        this.updateTabButtons(screenName);
        
        // Cleanup: Exit-Klasse nach Transition entfernen
        setTimeout(() => {
          if (currentScreenElement) {
            currentScreenElement.classList.remove('exit-left');
            currentScreenElement.classList.add('enter-right');
          }
        }, 300);
      }, 50);
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
