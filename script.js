/**
 * Roboflow Image Recognition Test App
 * 
 * Diese App öffnet die Kamera, nimmt alle 1-2 Sekunden ein Frame,
 * sendet es an den Roboflow API Endpoint und zeigt die Erkennungsergebnisse.
 */

// === Konfiguration ===
const ROBOFLOW_API_KEY = 'l2LvnfFF1hhRi5dFwcJY';
const ROBOFLOW_MODEL_ID = 'artrecognition-test-u48k2';
const ROBOFLOW_VERSION = '1';
const ROBOFLOW_URL = `https://serverless.roboflow.com/${ROBOFLOW_MODEL_ID}/${ROBOFLOW_VERSION}`;

const FRAME_INTERVAL = 1500; // ms zwischen Frames (1.5 Sekunden)
const JPEG_QUALITY = 0.8;
const CONFIDENCE_THRESHOLD = 0.3; // Mindest-Confidence um Ergebnis zu zeigen

// === DOM Elemente ===
const videoEl = document.getElementById('camera');
const canvasEl = document.getElementById('canvas');
const resultEl = document.getElementById('result');
const startBtn = document.getElementById('startBtn');

// === State ===
let stream = null;
let frameIntervalId = null;
let isRunning = false;

/**
 * Initialisiert die Kamera und startet die Erkennung
 */
async function startCamera() {
  try {
    startBtn.disabled = true;
    startBtn.textContent = 'Kamera wird geöffnet...';

    // Check ob navigator.mediaDevices verfügbar ist
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'getUserMedia nicht unterstützt. ' +
        'Stelle sicher, dass: ' +
        '1) Die Seite über HTTPS lädt (nicht HTTP). ' +
        '2) Dein Browser die Kamera unterstützt (Chrome, Firefox, Safari 11+). ' +
        '3) Du Kamera-Zugriff erlaubt hast.'
      );
    }

    // Anforderung Kamera-Zugriff
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Rückkamera auf Smartphones
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });

    // Stream an video Element binden
    videoEl.srcObject = stream;

    // Warte bis Video lädt
    await new Promise(resolve => {
      videoEl.onloadedmetadata = () => {
        videoEl.play();
        resolve();
      };
    });

    // Canvas größe setzen
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;

    isRunning = true;
    startBtn.textContent = 'Kamera läuft...';
    startBtn.disabled = true;

    // Starte Frame-Capture-Loop
    captureAndSend();
  } catch (error) {
    console.error('Fehler beim Öffnen der Kamera:', error);
    resultEl.innerHTML = `<div class="result-empty">❌ Kamera-Fehler:<br><small>${error.message}</small></div>`;
    startBtn.disabled = false;
    startBtn.textContent = 'Kamera starten';
  }
}

/**
 * Nimmt ein Frame aus der <video>, konvertiert zu Base64, sendet zu Roboflow
 */
async function captureAndSend() {
  if (!isRunning) return;

  try {
    // Canvas Context
    const ctx = canvasEl.getContext('2d');
    
    // Frame zeichnen
    ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

    // Canvas zu Blob (JPEG, 0.8 Qualität)
    canvasEl.toBlob(
      async (blob) => {
        // Blob zu Base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Image = reader.result;

          try {
            // Sende zu Roboflow
            const response = await fetch(ROBOFLOW_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: `api_key=${ROBOFLOW_API_KEY}&image=${encodeURIComponent(base64Image)}`
            });

            if (!response.ok) {
              throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();

            // Verarbeite Ergebnis
            displayResult(data);
          } catch (error) {
            console.error('Fehler bei API-Anfrage:', error);
            resultEl.innerHTML = `<div class="result-empty">⚠️ API-Fehler: ${error.message}</div>`;
          }

          // Plant nächsten Frame
          if (isRunning) {
            frameIntervalId = setTimeout(captureAndSend, FRAME_INTERVAL);
          }
        };
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  } catch (error) {
    console.error('Fehler beim Frame-Capture:', error);
    if (isRunning) {
      frameIntervalId = setTimeout(captureAndSend, FRAME_INTERVAL);
    }
  }
}

/**
 * Zeigt die Erkennungsergebnisse im UI
 * @param {Object} data - Roboflow API Response
 */
function displayResult(data) {
  if (!data || !data.predictions || data.predictions.length === 0) {
    resultEl.innerHTML = '<div class="result-empty">Keine Erkennung...</div>';
    return;
  }

  // Beste Vorhersage (erste = beste)
  const prediction = data.predictions[0];
  const { class: className, confidence } = prediction;
  const confidencePercent = (confidence * 100).toFixed(1);

  // Zeige Ergebnis nur wenn über Threshold
  if (confidence >= CONFIDENCE_THRESHOLD) {
    resultEl.innerHTML = `
      <div class="result-class">🎨 ${className}</div>
      <div class="result-confidence">Sicherheit: ${confidencePercent}%</div>
      <div class="result-status">✓ Erkannt</div>
    `;
  } else {
    resultEl.innerHTML = `<div class="result-empty">Zu unsicher (${confidencePercent}%)</div>`;
  }
}

/**
 * Stoppt die Kamera und Erkennung
 */
function stopCamera() {
  isRunning = false;
  if (frameIntervalId) {
    clearTimeout(frameIntervalId);
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  resultEl.innerHTML = '<div class="result-empty">Gestoppt</div>';
  startBtn.disabled = false;
  startBtn.textContent = 'Kamera starten';
}

// === Event Listener ===
startBtn.addEventListener('click', () => {
  if (isRunning) {
    stopCamera();
  } else {
    startCamera();
  }
});

// Cleanup wenn Tab geschlossen wird
window.addEventListener('beforeunload', () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
});
