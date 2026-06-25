/**
 * ARTWORK DETAIL CONTROLLER
 * =========================
 * Zeigt Details zu einem einzelnen Exponat
 * 
 * Features:
 * - Lädt Artwork-Daten aus artworks.json
 * - Zeigt Bild, Künstler, Titel, Materialien, Beschreibung
 * - Audio-Player (vorerst Dummy)
 */

class ArtworkDetailController {
  constructor() {
    this.currentExhibitionId = null;
    this.currentArtworkId = null;
    this.artworkData = null;
    this.audioPlayer = null;
    this.lightboxPanzoom = null;
    this._langHandler = null;
    this._basePath = null;
  }

  /**
   * Initialisiert den Controller
   * @param {number} exhibitionId - ID der Ausstellung
   * @param {string} artworkId - ID des Artworks (z.B. "001")
   */
  async init(exhibitionId, artworkId) {
    this.currentExhibitionId = exhibitionId;
    this.currentArtworkId = artworkId;

    try {
      await this.loadArtwork();
      this.renderArtwork();
    } catch (error) {
      console.error('❌ Error loading artwork detail:', error);
      this.showError();
    }
  }

  /**
   * Lädt das Artwork aus artworks.json
   */
  async loadArtwork() {
    const slug = this.getExhibitionSlug(this.currentExhibitionId);
    const jsonPath = `Content/ausstellung-${this.currentExhibitionId}-${slug}/artworks.json`;

    console.log(`📦 Loading artwork ${this.currentArtworkId} from: ${jsonPath}`);

    const response = await fetch(jsonPath);
    if (!response.ok) {
      throw new Error(`Failed to load artwork: ${response.status}`);
    }

    const data = await response.json();
    this.artworkData = data.artworks.find(a => a.id === this.currentArtworkId);

    if (!this.artworkData) {
      throw new Error(`Artwork ${this.currentArtworkId} not found`);
    }

    console.log(`✅ Loaded artwork:`, this.artworkData);
  }

  /**
   * Rendert das Artwork
   */
  renderArtwork() {
    const artwork = this.artworkData;
    const slug = this.getExhibitionSlug(this.currentExhibitionId);
    const basePath = `Content/ausstellung-${this.currentExhibitionId}-${slug}/`;
    this._basePath = basePath;

    // Hauptbild (erstes Image aus images-Array)
    const imageContainer = document.getElementById('artworkDetailImage');
    if (imageContainer && artwork.images && artwork.images.length > 0) {
      const img = document.createElement('img');
      img.src = basePath + artwork.images[0];
      img.alt = artwork.title;
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => this._openLightbox(img.src, artwork.title));
      imageContainer.appendChild(img);
    }

    // Künstler mit Geburtsjahr/Todesjahr
    const artistContainer = document.getElementById('artworkDetailArtist');
    if (artistContainer) {
      let artistText = artwork.artist;
      if (artwork.artistBorn || artwork.artistDied) {
        const born = artwork.artistBorn || '?';
        const died = artwork.artistDied || '';
        artistText += ` (*${born}${died ? ' & ' + died : ''})`;
      }
      artistContainer.textContent = artistText;
    }

    // Titel mit Jahr
    const titleContainer = document.getElementById('artworkDetailTitle');
    if (titleContainer) {
      let titleText = artwork.title;
      if (artwork.year) {
        titleText += `, ${artwork.year}`;
      }
      titleContainer.textContent = titleText;
    }

    // Materialien
    const materialsContainer = document.getElementById('artworkDetailMaterials');
    if (materialsContainer && artwork.materials) {
      materialsContainer.textContent = artwork.materials;
    }

    // Beschreibung (mit Paragraphen)
    // Unterstützt altes Format (string) und neues Format ({ de, en })
    this._renderDescription();

    // Bei Sprachwechsel Beschreibung und Audio neu laden
    this._langHandler = () => { this._renderDescription(); this._initAudio(); };
    document.addEventListener('languageChanged', this._langHandler);

    // Audio-Player initialisieren
    this._initAudio();
  }

  /**
   * Initialisiert den Audio-Player in der aktuellen Sprache
   */
  _initAudio() {
    const artwork = this.artworkData;
    if (!artwork || !artwork.audio) return;
    const audioContainer = document.getElementById('artworkDetailAudio');
    if (!audioContainer) return;

    const lang = document.documentElement.lang || 'de';
    const audioFile = (lang === 'en' && artwork.audio.en) ? artwork.audio.en : artwork.audio.de;
    if (!audioFile) return;

    const audioPath = this._basePath + audioFile;
    if (this.audioPlayer) {
      this.audioPlayer.destroy();
    }
    this.audioPlayer = new AudioPlayer(audioContainer, audioPath);
    console.log(`🎵 Audio player initialized [${lang}]: ${audioPath}`);
  }

  /**
   * Rendert die Beschreibung in der aktuellen Sprache
   */
  _renderDescription() {
    const artwork = this.artworkData;
    if (!artwork || !artwork.description) return;
    const descriptionContainer = document.getElementById('artworkDetailDescription');
    if (!descriptionContainer) return;
    descriptionContainer.innerHTML = '';
    const lang = document.documentElement.lang || 'de';
    const rawDesc = typeof artwork.description === 'object'
      ? (artwork.description[lang] || artwork.description.de || '')
      : artwork.description;
    const paragraphs = rawDesc.split('\n\n');
    paragraphs.forEach(para => {
      if (!para.trim()) return;
      const p = document.createElement('p');
      p.textContent = para.trim();
      descriptionContainer.appendChild(p);
    });
  }

  /**
   * Öffnet die Vollbild-Lightbox
   */
  _openLightbox(src, alt) {
    const lightbox  = document.getElementById('artworkLightbox');
    const panzoomEl = document.getElementById('artworkLightboxPanzoom');
    const img       = document.getElementById('artworkLightboxImg');
    const closeBtn  = document.getElementById('artworkLightboxClose');
    if (!lightbox || !img) return;

    img.src = src;
    img.alt = alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');

    // Touch-Events nicht nach außen durchlassen (verhindert versehentliche Zurück-Wischgeste)
    lightbox._stopTouch = (e) => e.stopPropagation();
    lightbox.addEventListener('touchstart', lightbox._stopTouch, { passive: true });
    lightbox.addEventListener('touchmove',  lightbox._stopTouch, { passive: true });
    lightbox.addEventListener('touchend',   lightbox._stopTouch, { passive: true });

    // Panzoom auf dem Wrapper-Div initialisieren
    if (typeof Panzoom !== 'undefined' && panzoomEl) {
      if (this.lightboxPanzoom) {
        this.lightboxPanzoom.destroy();
      }
      this.lightboxPanzoom = Panzoom(panzoomEl, {
        maxScale: 4,
        minScale: 1,
        startScale: 1,
        contain: false,
        animate: false
      });
      // Pinch-Zoom auf Touch-Geräten
      panzoomEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.lightboxPanzoom.zoomWithWheel(e);
      }, { passive: false });
    }

    // Close-Button
    closeBtn.onclick = () => this._closeLightbox();

    // Tap auf dunklen Hintergrund schließt ebenfalls
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) this._closeLightbox();
    }, { once: true });
  }

  /**
   * Schließt die Vollbild-Lightbox
   */
  _closeLightbox() {
    const lightbox = document.getElementById('artworkLightbox');
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    // Touch-Blocker wieder entfernen
    if (lightbox._stopTouch) {
      lightbox.removeEventListener('touchstart', lightbox._stopTouch);
      lightbox.removeEventListener('touchmove',  lightbox._stopTouch);
      lightbox.removeEventListener('touchend',   lightbox._stopTouch);
      lightbox._stopTouch = null;
    }
    if (this.lightboxPanzoom) {
      this.lightboxPanzoom.destroy();
      this.lightboxPanzoom = null;
    }
  }

  /**
   * Hole den Slug für eine Exhibition ID
   */
  getExhibitionSlug(exhibitionId) {
    const slugs = {
      1: 'OnlineSince1996',
      2: 'RememberedNotReal',
      3: 'DenkeFreiSchaffeNeu'
    };
    return slugs[exhibitionId] || '';
  }

  /**
   * Zeigt Fehler-Nachricht
   */
  showError() {
    const descriptionContainer = document.getElementById('artworkDetailDescription');
    descriptionContainer.innerHTML = '<p>Fehler beim Laden der Exponat-Details</p>';
  }

  /**
   * Cleanup beim Verlassen der Seite
   */
  cleanup() {
    if (this._langHandler) {
      document.removeEventListener('languageChanged', this._langHandler);
      this._langHandler = null;
    }
    if (this.audioPlayer) {
      this.audioPlayer.destroy();
      this.audioPlayer = null;
    }
    this._closeLightbox();
  }
}

// Globale Instanz
window.ArtworkDetailController = ArtworkDetailController;
