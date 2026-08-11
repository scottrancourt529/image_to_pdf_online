// Wires up the drop zone: drag & drop from the OS, click-to-browse,
// and keyboard activation. Calls `onFiles(FileList|File[])` with
// whatever image files it collects — validation happens in app.js.
const DragDrop = (() => {

  function init({ dropZoneEl, fileInputEl, browseBtnEl, onFiles }) {

    function openBrowser() {
      fileInputEl.click();
    }

    dropZoneEl.addEventListener('click', (e) => {
      // Avoid double-triggering when the inner "browse" link is clicked.
      if (e.target === browseBtnEl) return;
      openBrowser();
    });

    dropZoneEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openBrowser();
      }
    });

    browseBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      openBrowser();
    });

    fileInputEl.addEventListener('change', () => {
      if (fileInputEl.files && fileInputEl.files.length) {
        onFiles(fileInputEl.files);
      }
      // Reset so selecting the same file again still fires "change".
      fileInputEl.value = '';
    });

    let dragCounter = 0;

    dropZoneEl.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      dropZoneEl.classList.add('drag-over');
    });

    dropZoneEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    dropZoneEl.addEventListener('dragleave', () => {
      dragCounter = Math.max(0, dragCounter - 1);
      if (dragCounter === 0) dropZoneEl.classList.remove('drag-over');
    });

    dropZoneEl.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      dropZoneEl.classList.remove('drag-over');
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) onFiles(files);
    });

    // Also allow dropping anywhere on the page once the queue exists,
    // so users aren't forced to hit the (now smaller) drop zone exactly.
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      if (e.target.closest('#drop-zone')) return; // already handled above
      e.preventDefault();
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) onFiles(files);
    });
  }

  return { init };
})();
