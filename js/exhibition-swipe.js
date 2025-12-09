// Exhibition Back-Swipe Handler
// Right-Swipe auf Ausstellungsseite -> Zurück zur Startseite
// Mindestens 80px horizontale Bewegung erforderlich, um zu vermeiden
// dass vertikales Scrollen ausversehen "Zurück" auslöst

class ExhibitionSwipeHandler {
  constructor() {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.init();
  }

  init() {
    document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
  }

  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  handleTouchMove(e) {
    if (!e.touches.length) return;

    const touch = e.touches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;

    // Horizontale Bewegung dominiert -> Scroll verhindern (wichtig für iOS Safari)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      e.preventDefault();
    }
  }

  handleTouchEnd(e) {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;

    // Right-Swipe: Mindestens 80px nach rechts, deutlich mehr als vertikal
    if (dx > 80 && Math.abs(dx) > Math.abs(dy)) {
      window.location.href = 'index.html';
    }
  }
}

// Initialisieren sobald DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new ExhibitionSwipeHandler();
  console.log('✅ Exhibition back-swipe handler initialized');
});
