/**
 * MapZoomController - Zoom für Lagepläne
 */

let panzoomInstance = null;
let wheelHandler = null;
let isInitialized = false;

console.log('MapZoomController: Script geladen');

// Überwache loadScreen Funktion
const originalLoadScreen = window.loadScreen;
if (originalLoadScreen) {
  window.loadScreen = function(screenName) {
    console.log('MapZoomController: loadScreen aufgerufen für', screenName);
    const result = originalLoadScreen.apply(this, arguments);
    
    // Wenn Map-Screen geladen wird, initialisiere nach kurzer Verzögerung
    if (screenName && screenName.includes('map-')) {
      setTimeout(() => {
        console.log('MapZoomController: Map-Screen erkannt, initialisiere...');
        tryInitMapZoom();
      }, 400);
    }
    
    return result;
  };
}

// Bei DOM-Load
document.addEventListener('DOMContentLoaded', () => {
  console.log('MapZoomController: DOM loaded');
  
  // Überwache auch später definiertes loadScreen
  setTimeout(() => {
    if (window.loadScreen && window.loadScreen !== originalLoadScreen) {
      const laterLoadScreen = window.loadScreen;
      window.loadScreen = function(screenName) {
        console.log('MapZoomController: loadScreen (später) aufgerufen für', screenName);
        const result = laterLoadScreen.apply(this, arguments);
        
        if (screenName && screenName.includes('map-')) {
          setTimeout(() => {
            console.log('MapZoomController: Map-Screen erkannt, initialisiere...');
            tryInitMapZoom();
          }, 400);
        }
        
        return result;
      };
    }
  }, 1000);
  
  // Fallback: Versuche direkt zu initialisieren falls schon auf Map-Seite
  checkAndInit();
});

// Bei Hash-Change (als Backup)
window.addEventListener('hashchange', () => {
  console.log('MapZoomController: Hash changed to', window.location.hash);
  setTimeout(checkAndInit, 300);
});

function checkAndInit() {
  const hash = window.location.hash;
  const search = window.location.search;
  
  // Prüfe Hash oder Query-Parameter
  if (hash.includes('map-') || search.includes('map-')) {
    console.log('MapZoomController: Auf Map-Seite, versuche Initialisierung...');
    tryInitMapZoom();
  }
}

function tryInitMapZoom(attempt = 1) {
  // Finde beliebigen Map-Container (unterstützt alle Stockwerke)
  const mapContainer = document.querySelector('[id^="map-plan-"]');
  
  if (!mapContainer) {
    if (attempt < 15) {
      console.log('MapZoomController: Container nicht gefunden, Versuch', attempt);
      setTimeout(() => tryInitMapZoom(attempt + 1), 250);
    } else {
      console.log('MapZoomController: Container nicht gefunden nach 15 Versuchen');
    }
    return;
  }
  
  console.log('MapZoomController: Container gefunden!', mapContainer);
  
  // Cleanup alte Instanz (auch wenn es ein anderer Container ist)
  destroyPanzoom();
  
  // Warte bis das Bild geladen ist
  const img = mapContainer.querySelector('img');
  if (!img) {
    console.log('MapZoomController: Bild nicht gefunden');
    return;
  }
  
  if (img.complete && img.naturalHeight > 0) {
    console.log('MapZoomController: Bild bereits geladen, initialisiere...');
    initMapZoom(mapContainer);
  } else {
    console.log('MapZoomController: Warte auf Bild-Load...');
    img.addEventListener('load', () => {
      console.log('MapZoomController: Bild geladen, initialisiere...');
      initMapZoom(mapContainer);
    }, { once: true });
  }
}

function initMapZoom(mapContainer) {
  // Reset Transform SOFORT als allererstes um Springen zu vermeiden
  mapContainer.style.transformOrigin = '50% 50%';
  mapContainer.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';
  mapContainer.style.transition = 'none';
  
  if (isInitialized) {
    console.log('MapZoomController: Bereits initialisiert, überspringe');
    return;
  }
  
  console.log('MapZoomController: Initialisiere Panzoom');
  
  try {
    // Initialisiere Panzoom
    panzoomInstance = Panzoom(mapContainer, {
      maxScale: 3,
      minScale: 1,
      step: 0.3,
      startScale: 1,
      startX: 0,
      startY: 0,
      contain: 'outside',
      animate: false
    });
    
    // Initiales Pan SOFORT auf Zentrum setzen
    panzoomInstance.pan(0, 0);
    
    // Bild einblenden
    const img = mapContainer.querySelector('img');
    if (img) {
      img.classList.add('panzoom-ready');
    }
    
    isInitialized = true;
    console.log('MapZoomController: ✅ Panzoom erfolgreich initialisiert');
    
    // Mouse Wheel Zoom
    const parent = mapContainer.parentElement;
    wheelHandler = (event) => {
      event.preventDefault();
      panzoomInstance.zoomWithWheel(event);
    };
    parent.addEventListener('wheel', wheelHandler, { passive: false });
    
    console.log('MapZoomController: ✅ Wheel-Event registriert');
    
  } catch (error) {
    console.error('MapZoomController: ❌ Fehler bei Initialisierung', error);
    isInitialized = false;
  }
}

function destroyPanzoom() {
  if (panzoomInstance) {
    console.log('MapZoomController: Cleanup alte Instanz');
    try {
      // Finde Container und reset Transform vor destroy
      const containers = document.querySelectorAll('[id^="map-plan-"]');
      containers.forEach(container => {
        container.style.transformOrigin = '50% 50%';
        container.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';
      });
      
      panzoomInstance.destroy();
    } catch (e) {
      console.warn('MapZoomController: Fehler beim Destroy', e);
    }
    panzoomInstance = null;
  }
  
  if (wheelHandler) {
    const mapContainer = document.getElementById('map-plan-1og');
    if (mapContainer && mapContainer.parentElement) {
      mapContainer.parentElement.removeEventListener('wheel', wheelHandler);
    }
    wheelHandler = null;
  }
  
  isInitialized = false;
}

