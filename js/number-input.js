class NumberInputController {
  constructor() {
    this.maxDigits = 3;
    this.container = null;
    this.display = null;
    this.digitButtons = [];
    this.deleteButton = null;
    this.enterButton = null;
    this.currentDigits = [];
    this.artworksPromise = null;
    this.resultsContainer = null;
    this.resultsHeading = null;
    this.placeholder = null;
    this.emptyState = null;
    this.foundState = null;
    this.resultItem = null;
    this.resultThumb = null;
    this.resultArtist = null;
    this.resultTitle = null;
    this.artworksCache = null;
    this.isLoadingArtworks = false;
  }

  init() {
    this.container = document.querySelector('.number-screen');
    if (!this.container) return;

    this.display = this.container.querySelector('[data-number-display]');
    this.digitButtons = Array.from(this.container.querySelectorAll('[data-digit]'));
    this.deleteButton = this.container.querySelector('[data-action="delete"]');
    this.enterButton = this.container.querySelector('[data-action="enter"]');
    this.resultsContainer = this.container.querySelector('#number-results');
    this.resultsHeading = this.container.querySelector('#number-results-heading');
    this.placeholder = this.container.querySelector('[data-number-placeholder]');
    this.emptyState = this.container.querySelector('[data-number-state="empty"]');
    this.foundState = this.container.querySelector('[data-number-state="found"]');
    this.resultItem = this.container.querySelector('.number-result-item');
    this.resultThumb = this.container.querySelector('[data-number-thumb]');
    this.resultArtist = this.container.querySelector('[data-number-artist]');
    this.resultTitle = this.container.querySelector('[data-number-title]');
    this.currentDigits = [];

    this.bindEvents();
    this.updateDisplay();
    this.resetResults();
  }

  bindEvents() {
    this.digitButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.handleDigit(button.dataset.digit);
      });
    });

    if (this.deleteButton) {
      this.deleteButton.addEventListener('click', () => this.handleDelete());
    }

    if (this.enterButton) {
      this.enterButton.addEventListener('click', () => this.handleEnter());
    }
  }

  handleDigit(digit) {
    if (this.currentDigits.length >= this.maxDigits) return;
    this.currentDigits.push(digit);
    this.updateDisplay();
    this.updateResults();
  }

  handleDelete() {
    if (!this.currentDigits.length) {
      this.resetResults();
      this.updateDisplay();
      return;
    }

    this.currentDigits = [];
    this.resetResults();
    this.updateDisplay();
  }

  handleEnter() {
    if (!this.currentDigits.length) return;
    // Noch keine Aktion vorgesehen
  }

  updateDisplay() {
    if (!this.display) return;

    const slots = Array.from({ length: this.maxDigits }, (_, index) => {
      return this.currentDigits[index] || '_';
    });

    this.display.textContent = slots.join(' ');

    const hasDigits = this.currentDigits.length > 0;
    this.display.classList.toggle('number-display-filled', hasDigits);
    this.display.classList.toggle('number-display-empty', !hasDigits);

    this.toggleActionState(this.deleteButton, hasDigits, 'images/icons/button_delete_red.png', 'images/icons/button_delete_grey.png');
    const hasResult = this.resultsContainer && this.resultsContainer.dataset.hasResult === 'true';
    const enterIcon = hasResult
      ? 'images/icons/button_enter_green.png'
      : 'images/icons/button_enter_grey.png';
    this.toggleActionState(this.enterButton, hasResult, enterIcon, 'images/icons/button_enter_grey.png');
  }

  async updateResults() {
    if (!this.resultsContainer || !this.resultItem) return;

    const inputNumber = this.currentDigits.join('');
    if (!inputNumber) {
      this.resetResults();
      this.updateDisplay();
      return;
    }

    const artworks = await this.loadArtworks();
    if (!artworks) {
      this.resetResults();
      return;
    }

    const match = artworks.find((artwork) => String(artwork.number) === inputNumber);

    if (match) {
      this.renderResult(match);
      this.updateDisplay();
    } else {
      this.resetResults();
      this.updateDisplay();
    }
  }

  resetResults() {
    if (!this.resultsContainer || !this.resultItem) return;
    this.resultsContainer.dataset.hasResult = 'false';
    if (this.emptyState) this.emptyState.hidden = false;
    if (this.foundState) this.foundState.hidden = true;
    if (this.placeholder) this.placeholder.hidden = false;
    if (this.resultsHeading) this.resultsHeading.classList.remove('visible');
    this.resultItem.hidden = true;
  }

  renderResult(artwork) {
    if (!this.resultThumb || !this.resultArtist || !this.resultTitle) return;

    // Bilde vollständigen Pfad mit Exhibition-Slug
    const exhibitionSlug = this.getExhibitionSlug(artwork.exhibitionId);
    const artworksAssetsBase = `Content/ausstellung-${artwork.exhibitionId}-${exhibitionSlug}/`;
    
    const thumbnailPath = artwork.thumbnail || '';
    const isAbsolute = /^https?:\/\//.test(thumbnailPath) || thumbnailPath.startsWith('/');
    this.resultThumb.src = isAbsolute ? thumbnailPath : `${artworksAssetsBase}${thumbnailPath}`;
    this.resultThumb.alt = artwork.title || '';
    this.resultArtist.textContent = artwork.artist || '';
    this.resultTitle.textContent = artwork.title || '';
    if (this.emptyState) this.emptyState.hidden = true;
    if (this.foundState) this.foundState.hidden = false;
    if (this.resultsHeading) this.resultsHeading.classList.add('visible');
    this.resultItem.hidden = false;
    this.resultsContainer.dataset.hasResult = 'true';
  }

  async loadArtworks() {
    if (this.artworksCache) return this.artworksCache;

    if (!this.artworksPromise) {
      this.isLoadingArtworks = true;
      this.artworksPromise = this.loadAllArtworksFromExhibitions()
        .finally(() => {
          this.isLoadingArtworks = false;
        });
    }

    this.artworksCache = await this.artworksPromise;
    return this.artworksCache;
  }

  /**
   * Lade alle Artworks aus allen drei Ausstellungen und führe sie zusammen
   */
  async loadAllArtworksFromExhibitions() {
    const exhibitions = [
      { id: 1, slug: 'OfOtherPlaces' },
      { id: 2, slug: 'VesselsOfUnbecoming' },
      { id: 3, slug: 'DenkeFreiSchaffeNeu' }
    ];

    try {
      // Lade alle drei JSONs parallel
      const promises = exhibitions.map(({ id, slug }) =>
        fetch(`Content/ausstellung-${id}-${slug}/artworks.json`)
          .then(response => {
            if (!response.ok) throw new Error(`Artworks JSON für Exhibition ${id} konnte nicht geladen werden`);
            return response.json();
          })
          .then(data => {
            // Füge exhibitionId zu jedem Artwork hinzu
            const artworks = data.artworks || [];
            return artworks.map(artwork => ({
              ...artwork,
              exhibitionId: id
            }));
          })
          .catch(error => {
            console.warn(`Fehler beim Laden von Exhibition ${id}:`, error);
            return [];
          })
      );

      const results = await Promise.all(promises);
      // Alle Arrays zusammenführen
      return results.flat();
    } catch (error) {
      console.error('Fehler beim Laden der Artworks:', error);
      return [];
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

  toggleActionState(button, isActive, activeIcon, inactiveIcon) {
    if (!button) return;
    button.classList.toggle('number-action-active', isActive);
    button.setAttribute('aria-disabled', String(!isActive));
    button.disabled = !isActive;

    const icon = button.querySelector('img');
    if (icon) {
      icon.src = isActive ? activeIcon : inactiveIcon;
    }
  }
}

window.NumberInputController = NumberInputController;
