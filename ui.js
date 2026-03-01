/**
 * ui.js - UI Utilities
 */

class UIManager {
  constructor() {
    this._container = null;
  }

  get notifContainer() {
    if (!this._container) {
      this._container = document.getElementById('notification-container');
      if (!this._container) {
        this._container = document.createElement('div');
        this._container.id = 'notification-container';
        document.body.appendChild(this._container);
      }
    }
    return this._container;
  }

  notify(message, type = 'info', duration = 3000) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const n = document.createElement('div');
    n.className = `notification ${type}`;
    n.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    this.notifContainer.appendChild(n);
    setTimeout(() => {
      n.classList.add('fadeOut');
      setTimeout(() => n.remove(), 300);
    }, duration);
  }

  success(msg) { this.notify(msg, 'success'); }
  error(msg)   { this.notify(msg, 'error', 4000); }
  info(msg)    { this.notify(msg, 'info'); }
  warning(msg) { this.notify(msg, 'warning'); }

  showLoading(btn, text = 'Đang xử lý...') {
    if (!btn) return;
    btn._origText = btn.innerHTML;
    btn._origDisabled = btn.disabled;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${text}`;
  }

  hideLoading(btn) {
    if (!btn || !btn._origText) return;
    btn.innerHTML = btn._origText;
    btn.disabled = btn._origDisabled || false;
  }

  openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }

  closeModalOnOverlayClick(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', (e) => {
      if (e.target === el) this.closeModal(id);
    });
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

window.UI = new UIManager();
