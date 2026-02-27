/**
 * MapMarkerController
 * Renders artwork location markers over a Panzoom floor plan image.
 *
 * Behaviour:
 *  - Single markers: always rendered as 30 px circles with artwork number.
 *  - Cluster markers: rendered as small 12 px dots; expand to full size at >= LOD_THRESHOLD zoom.
 *  - All markers counter-scale so their visual pixel size stays constant while the user zooms/pans.
 *  - Clicking a marker navigates to the artwork detail page via contentLoader.
 */

(function () {
  'use strict';

  const MARKER_SIZE_PX   = 36;   // full marker diameter (matches CSS)
  const CLUSTER_DOT_PX   = 12;   // collapsed cluster dot diameter
  const LOD_THRESHOLD    = 1.6;  // zoom level at which clusters expand
  const LARGE_SHRINK     = 0.08; // how aggressively large markers shrink when zooming in
  const MARKERS_JSON_URL = 'Content/map-markers.json';

  // Map from container-id suffix → JSON key
  const FLOOR_ID_MAP = {
    'map-plan-1og':         'hauptgebaeude-1og',
    'map-plan-2og':         'hauptgebaeude-2og',
    'map-plan-oktogon-1og': 'oktogon-1og',
    'map-plan-oktogon-2og': 'oktogon-2og'
  };

  class MapMarkerController {
    /**
     * @param {HTMLElement} mapContainer  The Panzoom element (has id="map-plan-*")
     */
    constructor(mapContainer) {
      this.mapContainer  = mapContainer;
      this.overlay       = null;
      this.markerEls     = [];   // { el, xPct, yPct, baseSize }
      this.currentScale  = 1;
      this.floorKey      = FLOOR_ID_MAP[mapContainer.id] || null;

      if (!this.floorKey) return;

      this._loadData();
    }

    // -----------------------------------------------------------------------
    // Data loading
    // -----------------------------------------------------------------------

    _loadData() {
      fetch(MARKERS_JSON_URL)
        .then(r => r.json())
        .then(data => {
          const config = data[this.floorKey];
          if (!config) return;
          this._buildOverlay(config);
        })
        .catch(err => console.warn('[MapMarkerController] Could not load markers:', err));
    }

    // -----------------------------------------------------------------------
    // DOM construction
    // -----------------------------------------------------------------------

    _buildOverlay(config) {
      // Create the overlay that sits on top of the image (but inside the
      // Panzoom element so it pans/zooms with the content).
      const overlay = document.createElement('div');
      overlay.className = 'map-marker-overlay';
      this.overlay = overlay;

      config.markers.forEach(marker => {
        if (marker.type === 'single') {
          this._createSingleMarker(overlay, marker);
        } else if (marker.type === 'cluster') {
          marker.artworks.forEach(art => {
            this._createClusterDot(overlay, art);
          });
        }
      });

      this._overlayScale      = config.overlayScale      !== undefined ? config.overlayScale      : 1;
      this._overlayOffsetYPct  = config.overlayOffsetYPct  !== undefined ? config.overlayOffsetYPct  : 0;

      this.mapContainer.appendChild(overlay);

      // Initial position pass once image dimensions are known
      this._scheduleReposition();
    }

    _createSingleMarker(parent, data) {
      const el = document.createElement('button');
      el.className   = 'map-marker';
      el.textContent = String(parseInt(data.id, 10)); // "001" → 1 → "1"
      el.setAttribute('aria-label', `Werk ${el.textContent}`);
      el.dataset.xPct         = data.xPct;
      el.dataset.yPct         = data.yPct;
      el.dataset.artworkId    = data.artworkId;
      el.dataset.exhibitionId = data.exhibitionId;
      el.dataset.baseSize     = MARKER_SIZE_PX;

      el.addEventListener('click', () => this._navigate(data.exhibitionId, data.artworkId));
      parent.appendChild(el);

      this.markerEls.push({ el, xPct: data.xPct, yPct: data.yPct, baseSize: MARKER_SIZE_PX });
    }

    _createClusterDot(parent, data) {
      const el = document.createElement('button');
      el.className   = 'map-marker cluster-dot';
      el.textContent = String(parseInt(data.id, 10));
      el.setAttribute('aria-label', `Werk ${el.textContent}`);
      el.dataset.xPct         = data.xPct;
      el.dataset.yPct         = data.yPct;
      el.dataset.artworkId    = data.artworkId;
      el.dataset.exhibitionId = data.exhibitionId;
      el.dataset.baseSize     = MARKER_SIZE_PX;

      el.addEventListener('click', () => this._navigate(data.exhibitionId, data.artworkId));
      parent.appendChild(el);

      this.markerEls.push({ el, xPct: data.xPct, yPct: data.yPct, baseSize: MARKER_SIZE_PX });
    }

    // -----------------------------------------------------------------------
    // Positioning & scaling
    // -----------------------------------------------------------------------

    _scheduleReposition() {
      // Wait until the image has a real rendered size
      const img = this.mapContainer.querySelector('img');
      if (!img) return;

      const tryPosition = () => {
        if (img.naturalWidth > 0) {
          this._repositionAll();
        } else {
          img.addEventListener('load', () => this._repositionAll(), { once: true });
        }
      };

      // Small delay to let Panzoom finish its own init transform
      requestAnimationFrame(tryPosition);
    }

    _getImageRect() {
      const img = this.mapContainer.querySelector('img');
      if (!img) return null;

      // getBoundingClientRect gives the on-screen position *after* Panzoom
      // transforms.  We need the rect in the Panzoom element's local coordinate
      // space (before the transform).  The easiest approach: use offsetLeft /
      // offsetTop / offsetWidth / offsetHeight which are in layout (pre-transform)
      // coordinates.
      return {
        left:   img.offsetLeft,
        top:    img.offsetTop,
        width:  img.offsetWidth,
        height: img.offsetHeight
      };
    }

    _repositionAll() {
      const rect = this._getImageRect();
      if (!rect || rect.width === 0) return;

      const floorScale   = this._overlayScale;
      const floorOffsetY = this._overlayOffsetYPct;

      this.markerEls.forEach(({ el, xPct, yPct }) => {
        // Apply floor-specific scale: compress both axes towards image centre
        const xPctAdj = 50 + (xPct - 50) * floorScale;
        // Base vertical compression (keeps all floors consistent) + floor scale + offset
        const yPctBase = 50 + (yPct - 50) * 0.9;
        const yPctAdj  = 50 + (yPctBase - 50) * floorScale + floorOffsetY;

        const x = rect.left + (xPctAdj / 100) * rect.width;
        const y = rect.top  + (yPctAdj  / 100) * rect.height;
        el.style.left = `${x}px`;
        el.style.top  = `${y}px`;
      });

      this._applyScaleToAll(this.currentScale);
    }

    /**
     * Called by map-zoom-controller on every zoom event.
     * @param {number} scale  The current Panzoom scale factor.
     */
    onZoom(scale) {
      this.currentScale = scale;
      this._applyScaleToAll(scale);
    }

    _applyScaleToAll(scale) {
      const isExpanded = scale >= LOD_THRESHOLD;

      this.markerEls.forEach(({ el }) => {
        const isCluster = el.classList.contains('cluster-dot');
        let T;

        if (isCluster && !isExpanded) {
          el.classList.remove('expanded');
          // Collapsed dot: interpolate visual size from CLUSTER_DOT_PX → MARKER_SIZE_PX
          // as scale goes from 1 → LOD_THRESHOLD, then hand off to expanded formula.
          const progress = Math.min((scale - 1) / (LOD_THRESHOLD - 1), 1);
          const targetVisual = CLUSTER_DOT_PX + (MARKER_SIZE_PX - CLUSTER_DOT_PX) * progress;
          T = targetVisual / (CLUSTER_DOT_PX * scale);
        } else if (isCluster && isExpanded) {
          el.classList.add('expanded');
          // Expanded cluster: anchored to MARKER_SIZE_PX at LOD_THRESHOLD,
          // shrinks gently as zoom increases further.
          // visual = MARKER_SIZE_PX * (LOD_THRESHOLD / scale)^LARGE_SHRINK
          T = Math.pow(LOD_THRESHOLD, LARGE_SHRINK) / Math.pow(scale, 1 + LARGE_SHRINK);
        } else {
          // Single marker: anchored to MARKER_SIZE_PX at scale=1,
          // shrinks gently as zoom increases.
          // visual = MARKER_SIZE_PX / scale^LARGE_SHRINK
          T = 1 / Math.pow(scale, 1 + LARGE_SHRINK);
        }

        el.style.transform = `translate(-50%, -50%) scale(${T})`;
      });
    }

    // -----------------------------------------------------------------------
    // Navigation
    // -----------------------------------------------------------------------

    _navigate(exhibitionId, artworkId) {
      // Aktuellen Map-Screen sichern für "Zurück"-Navigation
      const cl = window.contentLoader || (window.parent && window.parent.contentLoader);
      if (cl) window.mapBackScreen = cl.currentScreen;
      try {
        window.parent.contentLoader.loadArtworkDetail(exhibitionId, artworkId, window.mapBackScreen);
      } catch (e) {
        console.warn('[MapMarkerController] Navigation failed:', e);
      }
    }

    // -----------------------------------------------------------------------
    // Teardown
    // -----------------------------------------------------------------------

    destroy() {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.overlay    = null;
      this.markerEls  = [];
    }
  }

  // Expose globally so map-zoom-controller.js can instantiate it
  window.MapMarkerController = MapMarkerController;
})();
