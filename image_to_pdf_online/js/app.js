(() => {
  'use strict';

  // ---- state -------------------------------------------------------
  // Each item: { id, file, url, img, width, height }
  let items = [];

  // ---- DOM refs ------------------------------------------------------
  const els = {
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    browseBtn: document.getElementById('browse-btn'),
    addMoreBtn: document.getElementById('add-more-btn'),
    clearAllBtn: document.getElementById('clear-all-btn'),
    queueSection: document.getElementById('queue-section'),
    settingsSection: document.getElementById('settings-section'),
    thumbGrid: document.getElementById('thumb-grid'),
    imageCount: document.getElementById('image-count'),
    convertBtn: document.getElementById('convert-btn'),
    progressWrap: document.getElementById('progress-wrap'),
    progressBar: document.getElementById('progress-bar'),
    progressLabel: document.getElementById('progress-label'),
    pageSize: document.getElementById('page-size'),
    orientation: document.getElementById('orientation'),
    margin: document.getElementById('margin'),
    quality: document.getElementById('quality'),
    outputName: document.getElementById('output-name'),
    offlineBadge: document.getElementById('offline-badge')
  };

  UI.init(els, { onReorder: handleReorder, onRemove: handleRemove });

  DragDrop.init({
    dropZoneEl: els.dropZone,
    fileInputEl: els.fileInput,
    browseBtnEl: els.browseBtn,
    onFiles: handleIncomingFiles
  });

  els.addMoreBtn.addEventListener('click', () => els.fileInput.click());
  els.clearAllBtn.addEventListener('click', clearAll);
  els.convertBtn.addEventListener('click', convertToPdf);

  // ---- file intake ---------------------------------------------------

  async function handleIncomingFiles(fileList) {
    const files = Array.from(fileList).filter(Utils.isImageFile);
    const rejected = fileList.length - files.length;
    if (rejected > 0) {
      Utils.showToast(`Skipped ${rejected} file${rejected > 1 ? 's' : ''} that weren't images.`, { error: true });
    }
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const { img, url, width, height } = await Utils.loadImageElement(file);
        items.push({ id: Utils.uid(), file, url, img, width, height });
      } catch (err) {
        Utils.showToast(err.message, { error: true });
      }
    }
    render();
  }

  function handleRemove(id) {
    const item = items.find((i) => i.id === id);
    if (item) URL.revokeObjectURL(item.url);
    items = items.filter((i) => i.id !== id);
    render();
  }

  function handleReorder(draggedId, targetId) {
    const fromIndex = items.findIndex((i) => i.id === draggedId);
    const toIndex = items.findIndex((i) => i.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    render();
  }

  function clearAll() {
    items.forEach((i) => URL.revokeObjectURL(i.url));
    items = [];
    render();
  }

  function render() {
    UI.renderThumbs(items);
    UI.setSectionsVisible(items.length > 0);
  }

  // ---- conversion ------------------------------------------------------

  async function convertToPdf() {
    if (items.length === 0) return;

    UI.setConverting(true);
    UI.setProgress(0, 'Starting…');

    try {
      const options = {
        pageSize: els.pageSize.value,
        orientation: els.orientation.value,
        margin: Number(els.margin.value),
        quality: Number(els.quality.value),
        onProgress: (fraction, label) => UI.setProgress(fraction, label)
      };

      const blob = await PDFLib.createPdfFromImages(items, options);
      downloadBlob(blob, sanitizeFileName(els.outputName.value || 'converted') + '.pdf');
      Utils.showToast('PDF created \u2014 check your downloads.');
    } catch (err) {
      console.error(err);
      Utils.showToast('Something went wrong creating the PDF. Please try again.', { error: true });
    } finally {
      UI.setConverting(false);
      UI.hideProgress();
    }
  }

  function sanitizeFileName(name) {
    return name.trim().replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80) || 'converted';
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // ---- offline status --------------------------------------------------

  function updateOfflineBadge() {
    els.offlineBadge.classList.toggle('hidden', navigator.onLine);
  }
  window.addEventListener('online', updateOfflineBadge);
  window.addEventListener('offline', updateOfflineBadge);
  updateOfflineBadge();

  // ---- service worker registration --------------------------------------

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    });
  }

})();
