// Renders the thumbnail queue (with drag-to-reorder) and progress UI.
// Talks to app.js only through the callbacks passed into init().
const UI = (() => {

  let els = {};
  let onReorder = () => {};
  let onRemove = () => {};

  function init(elements, callbacks) {
    els = elements;
    onReorder = callbacks.onReorder;
    onRemove = callbacks.onRemove;
  }

  function renderThumbs(items) {
    els.thumbGrid.innerHTML = '';

    items.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'thumb-item';
      li.draggable = true;
      li.dataset.id = item.id;

      const img = document.createElement('img');
      img.src = item.url;
      img.alt = item.file.name;
      li.appendChild(img);

      const order = document.createElement('span');
      order.className = 'thumb-order';
      order.textContent = String(index + 1);
      li.appendChild(order);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'thumb-remove';
      removeBtn.setAttribute('aria-label', `Remove ${item.file.name}`);
      removeBtn.textContent = '\u00D7';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onRemove(item.id);
      });
      li.appendChild(removeBtn);

      const meta = document.createElement('div');
      meta.className = 'thumb-meta';
      meta.textContent = `${item.file.name} · ${Utils.formatBytes(item.file.size)}`;
      li.appendChild(meta);

      attachDragReorder(li, item.id);
      els.thumbGrid.appendChild(li);
    });

    els.imageCount.textContent = String(items.length);
  }

  function attachDragReorder(li, id) {
    li.addEventListener('dragstart', (e) => {
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      els.thumbGrid.querySelectorAll('.thumb-item').forEach((el) =>
        el.classList.remove('drag-over-target'));
    });
    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      li.classList.add('drag-over-target');
    });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over-target'));
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over-target');
      const draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId && draggedId !== id) onReorder(draggedId, id);
    });
  }

  function setSectionsVisible(hasImages) {
    els.queueSection.classList.toggle('hidden', !hasImages);
    els.settingsSection.classList.toggle('hidden', !hasImages);
    els.convertBtn.disabled = !hasImages;
  }

  function setProgress(fraction, label) {
    els.progressWrap.classList.remove('hidden');
    els.progressBar.style.width = `${Math.round(Utils.clamp(fraction, 0, 1) * 100)}%`;
    els.progressLabel.textContent = label || '';
  }

  function hideProgress() {
    els.progressWrap.classList.add('hidden');
    els.progressBar.style.width = '0%';
  }

  function setConverting(isConverting) {
    els.convertBtn.disabled = isConverting;
    els.convertBtn.textContent = isConverting ? 'Converting…' : 'Convert to PDF';
  }

  return { init, renderThumbs, setSectionsVisible, setProgress, hideProgress, setConverting };
})();
