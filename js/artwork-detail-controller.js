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

    // Hauptbild (erstes Image aus images-Array)
    const imageContainer = document.getElementById('artworkDetailImage');
    if (artwork.images && artwork.images.length > 0) {
      const img = document.createElement('img');
      img.src = basePath + artwork.images[0];
      img.alt = artwork.title;
      imageContainer.appendChild(img);
    }

    // Künstler mit Geburtsjahr/Todesjahr
    const artistContainer = document.getElementById('artworkDetailArtist');
    let artistText = artwork.artist;
    if (artwork.artistBorn || artwork.artistDied) {
      const born = artwork.artistBorn || '?';
      const died = artwork.artistDied || '';
      artistText += ` (*${born}${died ? ' & ' + died : ''})`;
    }
    artistContainer.textContent = artistText;

    // Titel mit Jahr
    const titleContainer = document.getElementById('artworkDetailTitle');
    let titleText = artwork.title;
    if (artwork.year) {
      titleText += `, ${artwork.year}`;
    }
    titleContainer.textContent = titleText;

    // Materialien
    const materialsContainer = document.getElementById('artworkDetailMaterials');
    if (artwork.materials) {
      materialsContainer.textContent = artwork.materials;
    }

    // Beschreibung (mit Paragraphen)
    const descriptionContainer = document.getElementById('artworkDetailDescription');
    if (artwork.description) {
      // Ersetze \n\n mit Paragraph-Breaks
      const paragraphs = artwork.description.split('\\n\\n');
      paragraphs.forEach(para => {
        const p = document.createElement('p');
        p.textContent = para.trim();
        descriptionContainer.appendChild(p);
      });
    }
  }

  /**
   * Hole den Slug für eine Exhibition ID
   */
  getExhibitionSlug(exhibitionId) {
    const slugs = {
      1: 'OfOtherPlaces',
      2: 'VesselsOfUnbecoming',
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
}

// Globale Instanz
window.ArtworkDetailController = ArtworkDetailController;
