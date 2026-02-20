// ===========================
// MAP NAVIGATION CONTROLLER
// ===========================

class MapNavigationController {
  constructor(screenName) {
    this.screenName = screenName;
    this.currentBuilding = this.detectBuilding();
    this.init();
  }

  detectBuilding() {
    if (this.screenName.includes('oktogon')) {
      return 'oktogon';
    } else if (this.screenName.includes('main')) {
      return 'hauptgebaeude';
    }
    return 'overview';
  }

  init() {
    // Bind thumbnail clicks (nur auf overview screen)
    if (this.screenName === 'map-overview') {
      this.bindThumbnailClicks();
    }

    // Bind tab clicks (auf allen screens)
    this.bindTabClicks();
  }

  bindThumbnailClicks() {
    const thumbnails = document.querySelectorAll('.map-thumbnail');
    
    thumbnails.forEach(thumbnail => {
      thumbnail.addEventListener('click', (e) => {
        const building = thumbnail.getAttribute('data-building');
        
        if (building === 'hauptgebaeude') {
          // Hauptgebäude → EG
          this.navigateToScreen('map-main-eg');
        } else if (building === 'oktogon') {
          // Oktogon → 1. OG
          this.navigateToScreen('map-oktogon-1og');
        }
      });
    });
  }

  bindTabClicks() {
    const tabs = document.querySelectorAll('.map-tab');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const floor = tab.getAttribute('data-floor');
        
        // Navigation basierend auf aktueller Position
        if (this.currentBuilding === 'hauptgebaeude' || this.screenName === 'map-overview') {
          // Von Hauptgebäude oder Overview
          if (floor === 'eg') {
            this.navigateToScreen('map-main-eg');
          } else if (floor === '1og') {
            this.navigateToScreen('map-main-1og');
          } else if (floor === '2og') {
            this.navigateToScreen('map-main-2og');
          } else if (floor === 'oktogon') {
            this.navigateToScreen('map-oktogon-1og'); // Oktogon → 1. OG
          }
        } else if (this.currentBuilding === 'oktogon') {
          // Von Oktogon
          if (floor === '1og') {
            this.navigateToScreen('map-oktogon-1og');
          } else if (floor === '2og') {
            this.navigateToScreen('map-oktogon-2og');
          } else if (floor === 'hauptgebaeude') {
            this.navigateToScreen('map-main-eg'); // Zurück → immer EG
          }
        }
      });
    });
  }

  navigateToScreen(targetScreen) {
    // Trigger screen transition via content-loader
    if (window.loadScreen) {
      window.loadScreen(targetScreen);
    }
  }

  cleanup() {
    // Remove all event listeners when screen is destroyed
    const thumbnails = document.querySelectorAll('.map-thumbnail');
    const tabs = document.querySelectorAll('.map-tab');
    
    thumbnails.forEach(thumbnail => {
      thumbnail.replaceWith(thumbnail.cloneNode(true));
    });
    
    tabs.forEach(tab => {
      tab.replaceWith(tab.cloneNode(true));
    });
  }
}

// Export for content-loader
window.MapNavigationController = MapNavigationController;
