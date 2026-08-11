// Small, dependency-free helpers shared across the app.
const Utils = (() => {

  function formatBytes(bytes) {
    if (!bytes) return '0 KB';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let value = bytes;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i++;
    }
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function uid() {
    return `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function isImageFile(file) {
    return file && typeof file.type === 'string' && file.type.startsWith('image/');
  }

  // Reads a File into an HTMLImageElement (via object URL) and resolves
  // with the image element plus its natural pixel dimensions.
  function loadImageElement(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve({ img, url, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Could not read "${file.name}" as an image.`));
      };
      img.src = url;
    });
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function showToast(message, { error = false, duration = 3200 } = {}) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('error', error);
    el.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.add('hidden'), duration);
  }

  return { formatBytes, uid, isImageFile, loadImageElement, clamp, showToast };
})();
