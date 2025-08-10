const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startBtn = document.getElementById('startBtn');
const captureBtn = document.getElementById('captureBtn');
const retakeBtn = document.getElementById('retakeBtn');
const saveBtn = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');
const downloadLink = document.getElementById('downloadLink');
const resultSection = document.getElementById('result');
const uploadedImage = document.getElementById('uploadedImage');
const uploadedUrl = document.getElementById('uploadedUrl');

let mediaStream = null;
let lastBlob = null;

function setStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function enableControls({ capturing = false, captured = false } = {}) {
  startBtn.disabled = capturing;
  captureBtn.disabled = !capturing;
  retakeBtn.disabled = !captured;
  saveBtn.disabled = !captured;
  downloadLink.classList.toggle('hidden', !captured);
}

async function startCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = mediaStream;
    video.classList.remove('hidden');
    canvas.classList.add('hidden');
    setStatus('Camera ready.');
    enableControls({ capturing: true, captured: false });
  } catch (err) {
    console.error(err);
    setStatus('Failed to access camera. Please allow permissions.', 'error');
  }
}

function captureFrame() {
  if (!mediaStream) return;
  const trackSettings = mediaStream.getVideoTracks()[0]?.getSettings() || {};
  const width = trackSettings.width || video.videoWidth || 1280;
  const height = trackSettings.height || video.videoHeight || 720;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, width, height);

  video.classList.add('hidden');
  canvas.classList.remove('hidden');

  canvas.toBlob((blob) => {
    lastBlob = blob;
    const objectUrl = URL.createObjectURL(blob);
    downloadLink.href = objectUrl;
    enableControls({ capturing: true, captured: true });
    setStatus('Captured frame. You can retake or save.');
  }, 'image/png');
}

function retake() {
  if (!mediaStream) return;
  video.classList.remove('hidden');
  canvas.classList.add('hidden');
  enableControls({ capturing: true, captured: false });
  setStatus('Ready to capture.');
}

async function saveCapture() {
  if (!lastBlob) return;
  setStatus('Uploading...');
  try {
    const formData = new FormData();
    formData.append('photo', lastBlob, 'capture.png');

    const response = await fetch('/upload', { method: 'POST', body: formData });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    resultSection.classList.remove('hidden');
    uploadedImage.src = data.url;
    uploadedUrl.href = data.url;
    uploadedUrl.textContent = data.url;

    setStatus('Upload successful.', 'success');
  } catch (err) {
    console.error(err);
    setStatus(`Upload failed: ${err.message}`, 'error');
  }
}

startBtn.addEventListener('click', startCamera);
captureBtn.addEventListener('click', captureFrame);
retakeBtn.addEventListener('click', retake);
saveBtn.addEventListener('click', saveCapture);

enableControls({ capturing: false, captured: false });
setStatus('Click "Start Camera" to begin.');