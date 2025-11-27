/**
 * TensorFlow.js Image Recognition für Kunstwerk-Erkennung
 * Lokale Inferenz ohne Netzwerk-Abhängigkeiten
 */

// Configuration
const MODEL_PATH = './tfjs_model/model.json';
const CLASS_NAMES_PATH = './tfjs_model/class_names.json';
const FRAME_INTERVAL = 1500; // ms zwischen Vorhersagen
const CONFIDENCE_THRESHOLD = 0.5;

// DOM elements
const videoEl = document.getElementById('camera');
const canvasEl = document.getElementById('canvas');
const resultEl = document.getElementById('result');
const startBtn = document.getElementById('startBtn');

// State
let stream = null;
let frameIntervalId = null;
let isRunning = false;
let artModel = null;
let classNames = null;

// === Custom Layer Registration ===
// RandomBrightness ist eine Keras Data-Augmentation Layer.
// Sie wird während Training genutzt, ist aber für Inferenz nicht nötig.
// Wir registrieren sie als Dummy-Layer (Identity), damit das Modell lädt.
class RandomBrightness extends tf.layers.Layer {
  static get className() {
    return 'RandomBrightness';
  }
  call(inputs) {
    // Während Inferenz: Pass-through (Identity)
    return inputs;
  }
  computeOutputShape(inputShape) {
    return inputShape;
  }
}
tf.serialization.registerClass(RandomBrightness);

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
    startBtn.disabled = true;
    startBtn.textContent = 'Kamera wird geöffnet...';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia nicht unterstützt. HTTPS/Browser prüfen.');
    }
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' }, 
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
    captureAndPredictLoop();
  } catch (err) {
    console.error('Fehler beim Starten der Kamera:', err);
    resultEl.innerHTML = `<div class="result-empty">Kamera-Fehler: ${err.message}</div>`;
    startBtn.disabled = false;
    startBtn.textContent = 'Kamera starten';
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

function displayModelResult(r) {
  if (!r) { 
    resultEl.innerHTML = '<div class="result-empty">Keine Erkennung</div>'; 
    return; 
  }
  const pct = (r.confidence * 100).toFixed(1);
  if (r.confidence >= CONFIDENCE_THRESHOLD) {
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
  isRunning = false;
  if (frameIntervalId) clearTimeout(frameIntervalId);
  if (stream) stream.getTracks().forEach(t => t.stop());
  resultEl.innerHTML = '<div class="result-empty">Gestoppt</div>';
  startBtn.disabled = false;
  startBtn.textContent = 'Kamera starten';
}

document.addEventListener('DOMContentLoaded', async () => {
  loadArtModel();
  startBtn.addEventListener('click', () => { 
    if (isRunning) stopCamera(); 
    else startCamera(); 
  });
});

