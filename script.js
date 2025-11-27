/**
 * TF.js Image Recognition Test App
 * Replaces Roboflow REST calls with local TensorFlow.js inference.
 */

// Configuration
const MODEL_PATH = './tfjs_model/model.json';
const CLASS_NAMES_PATH = './tfjs_model/class_names.json';
const FRAME_INTERVAL = 1500; // ms between predictions

// DOM elements
const videoEl = document.getElementById('camera');
const canvasEl = document.getElementById('canvas');
const resultEl = document.getElementById('result');
const startBtn = document.getElementById('startBtn');
const fileInput = document.getElementById('fileInput');

// State
let stream = null;
let frameIntervalId = null;
let isRunning = false;
let artModel = null;
let classNames = null;

async function loadArtModel() {
  try {
    resultEl.innerHTML = '<div class="result-status">Modell wird geladen…</div>';
    artModel = await tf.loadLayersModel(MODEL_PATH);
    try {
      const resp = await fetch(CLASS_NAMES_PATH);
      classNames = await resp.json();
    } catch (e) {
      console.warn('class_names.json nicht gefunden, benutze Indizes', e);
      classNames = null;
    }
    resultEl.innerHTML = '<div class="result-status">Modell geladen</div>';
  } catch (err) {
    console.error('Fehler beim Laden des Modells:', err);
    resultEl.innerHTML = '<div class="result-empty">Fehler beim Laden des Modells. Konsole prüfen.</div>';
  }
}

function preprocessImageForArtModel(imageOrCanvas) {
  return tf.tidy(() => {
    let tensor = tf.browser.fromPixels(imageOrCanvas);
    if (tensor.shape[2] === 4) tensor = tensor.slice([0, 0, 0], [-1, -1, 3]);
    tensor = tf.image.resizeBilinear(tensor, [224, 224]);
    tensor = tensor.toFloat().div(127.5).sub(1.0);
    tensor = tensor.expandDims(0);
    return tensor;
  });
}

async function predictArtwork(imageOrCanvas) {
  if (!artModel) {
    await loadArtModel();
    if (!artModel) throw new Error('Modell konnte nicht geladen werden');
  }
  return tf.tidy(() => {
    const inputTensor = preprocessImageForArtModel(imageOrCanvas);
    let logits = artModel.predict(inputTensor);
    if (Array.isArray(logits)) logits = logits[0];
    let probsTensor = logits;
    const maxVal = probsTensor.max().dataSync()[0];
    if (!(maxVal <= 1.01 && maxVal >= 0)) probsTensor = tf.softmax(logits);
    const probs = probsTensor.dataSync();
    let bestIndex = 0;
    let bestVal = probs[0];
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > bestVal) { bestVal = probs[i]; bestIndex = i; }
    }
    const name = classNames && classNames[bestIndex] ? classNames[bestIndex] : String(bestIndex);
    inputTensor.dispose();
    if (probsTensor !== logits) probsTensor.dispose();
    return { className: name, classIndex: bestIndex, confidence: Number(bestVal) };
  });
}

async function startCamera() {
  try {
    startBtn.disabled = true; startBtn.textContent = 'Kamera wird geöffnet...';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('getUserMedia nicht unterstützt. HTTPS/Browser prüfen.');
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    videoEl.srcObject = stream;
    await new Promise(resolve => { videoEl.onloadedmetadata = () => { videoEl.play(); resolve(); }; });
    canvasEl.width = videoEl.videoWidth; canvasEl.height = videoEl.videoHeight;
    isRunning = true; startBtn.textContent = 'Kamera läuft...'; startBtn.disabled = true;
    captureAndPredictLoop();
  } catch (err) {
    console.error('Fehler beim Starten der Kamera:', err);
    resultEl.innerHTML = `<div class="result-empty">Kamera-Fehler: ${err.message}</div>`;
    startBtn.disabled = false; startBtn.textContent = 'Kamera starten';
  }
}

async function captureAndPredictLoop() {
  if (!isRunning) return;
  try {
    const ctx = canvasEl.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
    try {
      const res = await predictArtwork(canvasEl);
      displayModelResult(res);
    } catch (e) {
      console.error('Vorhersage-Fehler:', e);
      resultEl.innerHTML = '<div class="result-empty">Vorhersage-Fehler</div>';
    }
  } catch (e) {
    console.error('Capture-Fehler:', e);
  }
  if (isRunning) frameIntervalId = setTimeout(captureAndPredictLoop, FRAME_INTERVAL);
}

async function handleFileInput(file) {
  if (!file) return;
  const img = new Image();
  img.onload = async () => {
    canvasEl.width = img.naturalWidth; canvasEl.height = img.naturalHeight;
    const ctx = canvasEl.getContext('2d'); ctx.drawImage(img, 0, 0);
    try { const res = await predictArtwork(canvasEl); displayModelResult(res); } catch (e) { console.error('Vorhersage-Fehler:', e); resultEl.innerHTML = '<div class="result-empty">Vorhersage-Fehler</div>'; }
  };
  img.src = URL.createObjectURL(file);
}

function displayModelResult(r) {
  const threshold = 0.5;
  if (!r) { resultEl.innerHTML = '<div class="result-empty">Keine Erkennung</div>'; return; }
  const pct = (r.confidence * 100).toFixed(1);
  if (r.confidence >= threshold) {
    resultEl.innerHTML = `
      <div class="result-class">🎨 ${r.className}</div>
      <div class="result-confidence">Sicherheit: ${pct}%</div>
      <div class="result-status">✓ Erkannt</div>
    `;
  } else {
    resultEl.innerHTML = `<div class="result-empty">Unsicher: ${pct}%</div>`;
  }
}

function stopCamera() {
  isRunning = false; if (frameIntervalId) clearTimeout(frameIntervalId); if (stream) stream.getTracks().forEach(t => t.stop()); resultEl.innerHTML = '<div class="result-empty">Gestoppt</div>'; startBtn.disabled = false; startBtn.textContent = 'Kamera starten';
}

document.addEventListener('DOMContentLoaded', async () => {
  loadArtModel();
  startBtn.addEventListener('click', () => { if (isRunning) stopCamera(); else startCamera(); });
  if (fileInput) fileInput.addEventListener('change', (ev) => { const f = ev.target.files && ev.target.files[0]; handleFileInput(f); });
});
const ROBOFLOW_VERSION = '1';
const ROBOFLOW_URL = `https://serverless.roboflow.com/${ROBOFLOW_MODEL_ID}/${ROBOFLOW_VERSION}?api_key=${ROBOFLOW_API_KEY}`;

const FRAME_INTERVAL = 1500;
const JPEG_QUALITY = 0.8;
const CONFIDENCE_THRESHOLD = 0.3;

// === DOM Elemente ===
const videoEl = document.getElementById('camera');
const canvasEl = document.getElementById('canvas');
const resultEl = document.getElementById('result');
const startBtn = document.getElementById('startBtn');

// === State ===
let stream = null;
let frameIntervalId = null;
let isRunning = false;

async function startCamera() {
  try {
    startBtn.disabled = true;
    startBtn.textContent = 'Kamera wird geöffnet...';

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'getUserMedia nicht unterstützt. ' +
        'Stelle sicher, dass: ' +
        '1) Die Seite über HTTPS lädt (nicht HTTP). ' +
        '2) Dein Browser die Kamera unterstützt (Chrome, Firefox, Safari 11+). ' +
        '3) Du Kamera-Zugriff erlaubt hast.'
      );
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });

    videoEl.srcObject = stream;

    await new Promise(resolve => {
      videoEl.onloadedmetadata = () => {
        videoEl.play();
        resolve();
      };
    });

    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;

    isRunning = true;
    startBtn.textContent = 'Kamera läuft...';
    startBtn.disabled = true;

    captureAndSend();
  } catch (error) {
    console.error('Fehler beim Öffnen der Kamera:', error);
    resultEl.innerHTML = `<div class="result-empty">❌ Kamera-Fehler:<br><small>${error.message}</small></div>`;
    startBtn.disabled = false;
    startBtn.textContent = 'Kamera starten';
  }
}

async function captureAndSend() {
  if (!isRunning) return;

  try {
    const ctx = canvasEl.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

    canvasEl.toBlob(
      async (blob) => {
        try {
          if (!blob || blob.size === 0) {
            console.warn('Blob ist leer oder undefined!', blob);
            resultEl.innerHTML = '<div class="result-empty">⚠️ Canvas-Fehler: Kein Bild</div>';
            if (isRunning) {
              frameIntervalId = setTimeout(captureAndSend, FRAME_INTERVAL);
            }
            return;
          }

          console.log('Blob-Größe:', blob.size, 'bytes');
          console.log('Sende zu:', ROBOFLOW_URL);

          const formData = new FormData();
          formData.append('file', blob);

          const response = await fetch(ROBOFLOW_URL, {
            method: 'POST',
            body: formData
          });

          console.log('Response Status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Server Fehler:', errorText);
            throw new Error(`HTTP Error: ${response.status}`);
          }

          const data = await response.json();
          displayResult(data);
        } catch (error) {
          console.error('Fehler bei API-Anfrage:', error);
          resultEl.innerHTML = `<div class="result-empty">⚠️ API-Fehler: ${error.message}</div>`;
        }

        if (isRunning) {
          frameIntervalId = setTimeout(captureAndSend, FRAME_INTERVAL);
        }
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

function displayResult(data) {
  if (!data || !data.predictions || data.predictions.length === 0) {
    resultEl.innerHTML = '<div class="result-empty">Keine Erkennung...</div>';
    return;
  }

  const prediction = data.predictions[0];
  const { class: className, confidence } = prediction;
  const confidencePercent = (confidence * 100).toFixed(1);

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

startBtn.addEventListener('click', () => {
  if (isRunning) {
    stopCamera();
  } else {
    startCamera();
  }
});

window.addEventListener('beforeunload', () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
});
