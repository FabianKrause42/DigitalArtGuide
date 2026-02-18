/**
 * AUDIO PLAYER COMPONENT
 * ======================
 * Wiederverwendbare Audio-Player Komponente für Audioguides
 * Features: Play/Pause, Timeline, Scrubbing, Volume Control, Time Display
 */

class AudioPlayer {
  constructor(container, audioSrc) {
    this.container = container;
    this.audioSrc = audioSrc;
    this.audio = null;
    this.isPlaying = false;
    this.isDragging = false;
    this.isSeeking = false; // Flag für Seek-Vorgang
    
    // DOM Elements
    this.playPauseBtn = null;
    this.playPauseIcon = null;
    this.timeline = null;
    this.positionIndicator = null;
    this.timeDisplay = null;
    this.volumeBtn = null;
    this.volumePanel = null;
    this.volumeSlider = null;
    
    this.init();
  }

  init() {
    if (!this.container || !this.audioSrc) return;
    
    this.createAudioElement();
    this.renderPlayer();
    this.bindEvents();
  }

  createAudioElement() {
    this.audio = new Audio(this.audioSrc);
    this.audio.preload = 'metadata';
  }

  renderPlayer() {
    // Prüfe ob iOS (Volume-Control funktioniert nicht auf iOS)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    this.container.innerHTML = `
      <div class="audio-player-container">
        <button class="audio-player-play-pause" aria-label="Play">
          <img src="images/icons/play.png" alt="Play" class="audio-player-icon">
        </button>
        
        <div class="audio-player-timeline-wrapper">
          <div class="audio-player-timeline">
            <div class="audio-player-progress"></div>
            <div class="audio-player-position-indicator"></div>
          </div>
        </div>
        
        <div class="audio-player-time">0:00min</div>
        
        ${!isIOS ? `
        <button class="audio-player-volume-btn" aria-label="Volume">
          <img src="images/icons/speaker.png" alt="Volume">
        </button>
        
        <div class="audio-player-volume-panel" hidden>
          <input type="range" min="0" max="100" value="100" class="audio-player-volume-slider" orient="vertical">
        </div>
        ` : ''}
      </div>
    `;

    // Store references
    this.playPauseBtn = this.container.querySelector('.audio-player-play-pause');
    this.playPauseIcon = this.container.querySelector('.audio-player-icon');
    this.timeline = this.container.querySelector('.audio-player-timeline');
    this.progress = this.container.querySelector('.audio-player-progress');
    this.positionIndicator = this.container.querySelector('.audio-player-position-indicator');
    this.timeDisplay = this.container.querySelector('.audio-player-time');
    this.volumeBtn = this.container.querySelector('.audio-player-volume-btn');
    this.volumePanel = this.container.querySelector('.audio-player-volume-panel');
    this.volumeSlider = this.container.querySelector('.audio-player-volume-slider');
  }

  bindEvents() {
    // Play/Pause
    this.playPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePlay();
    });
    
    // Timeline scrubbing - nur mousedown/move/up (kein separates click event)
    this.timeline.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.seek(e);
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.seek(e);
      }
    });
    
    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    
    // Touch events for timeline
    this.timeline.addEventListener('touchstart', (e) => {
      this.isDragging = true;
      this.seek(e);
      e.preventDefault();
    });
    
    this.timeline.addEventListener('touchmove', (e) => {
      if (this.isDragging) {
        e.preventDefault();
        this.seek(e);
      }
    });
    
    this.timeline.addEventListener('touchend', () => {
      this.isDragging = false;
    });
    
    // Volume toggle (nur wenn vorhanden - nicht auf iOS)
    if (this.volumeBtn) {
      this.volumeBtn.addEventListener('click', () => this.toggleVolume());
    }
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => this.changeVolume(e));
    }
    
    // Audio events
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('loadedmetadata', () => this.updateTimeDisplay());
    this.audio.addEventListener('ended', () => this.onEnded());
    
    // Close volume panel when clicking outside (nur wenn vorhanden)
    if (this.volumeBtn && this.volumePanel) {
      document.addEventListener('click', (e) => {
        if (!this.volumeBtn.contains(e.target) && !this.volumePanel.contains(e.target)) {
          this.volumePanel.hidden = true;
        }
      });
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.audio.play();
    this.isPlaying = true;
    this.playPauseIcon.src = 'images/icons/pause.png';
    this.playPauseIcon.alt = 'Pause';
    this.playPauseBtn.setAttribute('aria-label', 'Pause');
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.playPauseIcon.src = 'images/icons/play.png';
    this.playPauseIcon.alt = 'Play';
    this.playPauseBtn.setAttribute('aria-label', 'Play');
  }

  seek(event) {
    const rect = this.timeline.getBoundingClientRect();
    const clientX = event.clientX !== undefined ? event.clientX : (event.touches ? event.touches[0].clientX : 0);
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, offsetX / rect.width));
    
    if (!isNaN(this.audio.duration) && this.audio.duration > 0) {
      const wasPlaying = !this.audio.paused;
      const newTime = percentage * this.audio.duration;
      
      this.isSeeking = true;
      
      if (wasPlaying) {
        this.audio.pause();
      }
      
      this.audio.currentTime = newTime;
      
      const onSeeked = () => {
        this.isSeeking = false;
        
        if (wasPlaying) {
          this.audio.play().catch(e => console.error('Audio play error:', e));
        }
        
        this.audio.removeEventListener('seeked', onSeeked);
        this.updateProgress();
      };
      
      this.audio.addEventListener('seeked', onSeeked, { once: true });
    }
  }

  updateProgress() {
    if (!this.audio.duration || this.isSeeking) return; // Skip während Seek
    
    const percentage = (this.audio.currentTime / this.audio.duration) * 100;
    this.progress.style.width = `${percentage}%`;
    this.positionIndicator.style.left = `${percentage}%`;
    this.updateTimeDisplay();
  }

  updateTimeDisplay() {
    if (!this.audio.duration) {
      this.timeDisplay.textContent = '0:00min';
      return;
    }
    
    const remaining = this.audio.duration - this.audio.currentTime;
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    this.timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}min`;
  }

  toggleVolume() {
    if (this.volumePanel) {
      this.volumePanel.hidden = !this.volumePanel.hidden;
    }
  }

  changeVolume(event) {
    if (this.audio) {
      this.audio.volume = event.target.value / 100;
    }
  }

  onEnded() {
    this.isPlaying = false;
    this.playPauseIcon.src = 'images/icons/play.png';
    this.playPauseIcon.alt = 'Play';
    this.playPauseBtn.setAttribute('aria-label', 'Play');
    this.audio.currentTime = 0;
    this.updateProgress();
  }

  destroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }
}

window.AudioPlayer = AudioPlayer;
