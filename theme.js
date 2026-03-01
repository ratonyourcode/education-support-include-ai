/**
 * theme.js - Theme Manager
 * FIX: Lưu theme vào localStorage, apply ngay khi load để tránh flicker.
 * Không reset khi chuyển route.
 */

(function () {
  const STORAGE_KEY = 'quiz-app-theme';

  // --- Áp dụng theme ngay lập tức (trước khi DOM render) ---
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  // --- Đọc theme từ localStorage (fallback: light) ---
  function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  // --- Toggle ---
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    updateToggleButton();
  }

  // --- Cập nhật icon nút toggle ---
  function updateToggleButton() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = isDark ? '☀️' : '🌙';
    btn.title = isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối';
  }

  // --- Bind nút toggle vào DOM ---
  function bindToggleButton() {
    updateToggleButton();
    const btn = document.getElementById('theme-toggle');
    if (btn && !btn._themeBound) {
      btn.addEventListener('click', toggleTheme);
      btn._themeBound = true;
    }
  }

  // --- Khởi tạo ---
  function init() {
    // Áp dụng theme đã lưu ngay lập tức (không chờ DOM)
    const saved = getSavedTheme();
    applyTheme(saved);

    // Bind nút toggle:
    // - Nếu DOM chưa ready → chờ DOMContentLoaded
    // - Nếu DOM đã ready (script load ở cuối body) → bind ngay
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindToggleButton);
    } else {
      bindToggleButton();
    }

    // Keyboard shortcut: Ctrl+Shift+L
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        toggleTheme();
      }
    });
  }

  // Chạy ngay lập tức
  init();

  // Expose API toàn cục
  window.ThemeManager = { toggleTheme, getSavedTheme, applyTheme };
})();
