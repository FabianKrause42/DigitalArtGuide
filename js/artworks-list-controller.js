/**
 * ARTWORKS LIST CONTROLLER
 * =========================
 * Lädt und rendert die Liste der Exponate einer Ausstellung
 * 
 * Features:
 * - Dynamisches Laden von artworks.json basierend auf Exhibition-ID
 * - Rendering der Artwork-Liste mit Thumbnails
 * - TODO: Suchfunktion später implementieren
 * - TODO: Lazy Loading / Virtual Scrolling für große Listen später optimieren
 */

class ArtworksListController {
  constructor() {
    this.currentExhibitionId = null;
    this.artworks = [];
    this.listContainer = null;
  }

  /**
   * Initialisiert den Controller
   * @param {number} exhibitionId - ID der Ausstellung (1, 2, oder 3)
   */
  async init(exhibitionId) {
    this.currentExhibitionId = exhibitionId;
    this.listContainer = document.querySelector('#artworksList');

    if (!this.listContainer) {
      console.error('❌ Artworks list container not found');
      return;
    }

    try {
      await this.loadArtworks();
      this.renderArtworks();
    } catch (error) {
      console.error('❌ Error loading artworks:', error);
      this.showError();
    }
  }

  /**
   * Lädt artworks.json der entsprechenden Ausstellung
   */
  async loadArtworks() {
    const slug = this.getExhibitionSlug(this.currentExhibitionId);
    const jsonPath = `Content/ausstellung-${this.currentExhibitionId}-${slug}/artworks.json`;

    console.log(`📦 Loading artworks from: ${jsonPath}`);

    const response = await fetch(jsonPath);
    if (!response.ok) {
      throw new Error(`Failed to load artworks: ${response.status}`);
    }

    const data = await response.json();
    this.artworks = data.artworks || [];

    console.log(`✅ Loaded ${this.artworks.length} artworks`);
  }

  /**
   * Rendert die Artwork-Liste
   */
  renderArtworks() {
    if (this.artworks.length === 0) {
      this.listContainer.innerHTML = '<div class="artworks-loading">Keine Exponate gefunden</div>';
      return;
    }

    // Leere Container
    this.listContainer.innerHTML = '';

    // Erstelle Listeneinträge
    this.artworks.forEach(artwork => {
      const item = this.createArtworkItem(artwork);
      this.listContainer.appendChild(item);
    });
  }

  /**
   * Erstellt ein einzelnes Artwork-Element
   * @param {Object} artwork - Artwork-Daten aus JSON
   * @returns {HTMLElement}
   */
  createArtworkItem(artwork) {
    const item = document.createElement('div');
    item.className = 'artwork-item';
    item.dataset.artworkId = artwork.id;

    // Thumbnail
    const thumb = document.createElement('div');
    thumb.className = 'artwork-thumb';
    const img = document.createElement('img');
    img.src = this.getArtworkThumbnailPath(artwork.thumbnail);
    img.alt = artwork.title;
    thumb.appendChild(img);

    // Info (Künstler + Titel)
    const info = document.createElement('div');
    info.className = 'artwork-list-info';

    const artist = document.createElement('p');
    artist.className = 'artwork-list-artist';
    artist.textContent = artwork.artist;

    const title = document.createElement('p');
    title.className = 'artwork-list-title';
    title.textContent = artwork.title;

    info.appendChild(artist);
    info.appendChild(title);

    // Zusammenbauen
    item.appendChild(thumb);
    item.appendChild(info);

    // Click-Handler (später für Detail-Ansicht)
    item.addEventListener('click', () => {
      console.log('🎨 Clicked artwork:', artwork.id, artwork.title);
      window.parent.contentLoader.loadArtworkDetail(this.currentExhibitionId, artwork.id);
    });

    return item;
  }

  /**
   * Gibt den vollständigen Pfad zum Thumbnail zurück
   * @param {string} thumbnailPath - Relativer Pfad aus JSON
   * @returns {string}
   */
  getArtworkThumbnailPath(thumbnailPath) {
    const slug = this.getExhibitionSlug(this.currentExhibitionId);
    return `Content/ausstellung-${this.currentExhibitionId}-${slug}/${thumbnailPath}`;
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
    this.listContainer.innerHTML = '<div class="artworks-loading">Fehler beim Laden der Exponate</div>';
  }
}

// Globale Instanz
window.ArtworksListController = ArtworksListController;
