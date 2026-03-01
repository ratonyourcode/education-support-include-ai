/**
 * exportService.js — Export Service Module
 * frontend/js/services/exportService.js
 *
 * Module dịch vụ xuất file HOÀN TOÀN ĐỘC LẬP.
 * Không phụ thuộc logic tạo quiz / làm quiz.
 * Load 1 lần, dùng được trên mọi trang.
 *
 * ═══════════════════════════════════════════
 *  CÁCH GỌI (public API)
 * ═══════════════════════════════════════════
 *
 *  ExportManager.toWord(quizOrId, includeAnswers)
 *    → quizOrId   : object quiz HOẶC string ID (tự resolve từ localStorage)
 *    → includeAnswers : true | false  (mặc định: true)
 *
 *  ExportManager.renderExportButtons(containerEl, quizOrId)
 *    → Render nút xuất trực tiếp vào container chỉ định
 *
 *  ExportManager.openExportModal(quizOrId)
 *    → Mở modal chọn tuỳ chọn đáp án rồi xuất Word
 *
 * ═══════════════════════════════════════════
 *  KỸ THUẬT
 * ═══════════════════════════════════════════
 *  Word : Blob HTML chuẩn Office XML (.doc)
 */

(function (window) {
  'use strict';

  /* ─────────────────────────────────────────
     HELPERS NỘI BỘ
  ───────────────────────────────────────── */

  /** Escape HTML — tránh XSS khi nhúng dữ liệu vào template */
  function _esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /**
   * Resolve quiz từ:
   *   - string ID  → tìm trong localStorage['quizzes']
   *   - object     → dùng trực tiếp
   */
  function _resolve(quizOrId) {
    if (typeof quizOrId === 'string') {
      try {
        var list = JSON.parse(localStorage.getItem('quizzes') || '[]');
        return list.find(function (q) { return q.id === quizOrId; }) || null;
      } catch (e) { return null; }
    }
    return quizOrId || null;
  }

  /** Lấy mảng options từ nhiều cấu trúc dữ liệu có thể có */
  function _opts(q) {
    if (Array.isArray(q.options) && q.options.length) return q.options;
    return [q.a, q.b, q.c, q.d].filter(function (v) {
      return v !== undefined && v !== null && v !== '';
    });
  }

  /**
   * Lấy index đáp án đúng (0–3), hỗ trợ:
   *   q.correctAnswer  = 0..3  hoặc  "A".."D"
   *   q.correct_answer = 0..3
   */
  function _correctIdx(q) {
    var L = ['A', 'B', 'C', 'D'];
    if (typeof q.correctAnswer  === 'number') return q.correctAnswer;
    if (typeof q.correct_answer === 'number') return q.correct_answer;
    if (typeof q.correctAnswer  === 'string') {
      var i = L.indexOf(q.correctAnswer.toUpperCase());
      return i >= 0 ? i : 0;
    }
    return 0;
  }

  /** Tên file an toàn từ tiêu đề quiz */
  function _filename(title) {
    return (title || 'quiz')
      .replace(/[^\w\s\-\u00C0-\u024F\u1E00-\u1EFF]/g, '')
      .trim() || 'quiz';
  }

  /* ─────────────────────────────────────────
     XUẤT WORD  (Blob HTML Office XML)
  ───────────────────────────────────────── */

  function _renderWord(quiz, includeAnswers) {
    var LETTERS = ['A', 'B', 'C', 'D'];
    var dateStr = quiz.createdAt
      ? new Date(quiz.createdAt).toLocaleDateString('vi-VN') : '';

    /* Xây HTML từng câu hỏi */
    var qHTML = (quiz.questions || []).map(function (q, qi) {
      var options = _opts(q);
      var ci      = _correctIdx(q);

      var optsHTML = options.map(function (opt, oi) {
        var letter = LETTERS[oi] || String.fromCharCode(65 + oi);
        var isOk   = includeAnswers && (oi === ci);
        return '<p style="margin:3pt 0 3pt 24pt;font-size:11pt;'
          + (isOk
            ? 'color:#059669;font-weight:bold;background:#f0fdf4;'
              + 'padding:2pt 6pt;border-left:3pt solid #10b981;'
            : 'color:#374151;')
          + '">'
          + (isOk ? '&#10003; ' : '')
          + '<b>' + letter + '.</b> ' + _esc(opt || '')
          + '</p>';
      }).join('');

      var ansLine = includeAnswers
        ? '<p style="margin:4pt 0 0 24pt;font-size:8.5pt;color:#6b7280;font-style:italic;">'
          + 'Đáp án đúng: <b style="color:#059669;">'
          + (LETTERS[ci] || '?') + '</b></p>'
        : '';

      return '<div style="margin-bottom:14pt;page-break-inside:avoid;">'
        + '<p style="margin:0 0 5pt 0;font-size:12pt;font-weight:bold;color:#1e1b4b;">'
        + '<span style="display:inline-block;background:#6366f1;color:#fff;border-radius:50%;'
        + 'width:20px;height:20px;text-align:center;line-height:20px;font-size:9pt;margin-right:7pt;">'
        + (qi + 1) + '</span>'
        + _esc(q.question || q.text || '')
        + '</p>' + optsHTML + ansLine
        + '</div>';
    }).join('<hr style="border:none;border-top:1px solid #e5e7eb;margin:10pt 0;"/>');

    var html = '<!DOCTYPE html>\n'
      + '<html xmlns:o="urn:schemas-microsoft-com:office:office"\n'
      + '      xmlns:w="urn:schemas-microsoft-com:office:word"\n'
      + '      xmlns="http://www.w3.org/TR/REC-html40">\n'
      + '<head><meta charset="UTF-8"/>\n'
      + '<meta name="ProgId" content="Word.Document"/>\n'
      + '<!--[if gte mso 9]><xml><w:WordDocument>'
      + '<w:View>Print</w:View><w:Zoom>90</w:Zoom>'
      + '<w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->\n'
      + '<style>\n'
      + '@page WordSection1{size:21cm 29.7cm;margin:2.5cm 2.8cm;}\n'
      + 'body{font-family:"Times New Roman",serif;font-size:12pt;color:#1e1b4b;}\n'
      + 'div{page-break-inside:avoid;}\n'
      + 'h1{font-size:20pt;color:#6366f1;margin:0 0 4pt 0;border-bottom:2pt solid #6366f1;padding-bottom:4pt;}\n'
      + '.meta{font-size:9pt;color:#9ca3af;margin:6pt 0 14pt 0;}\n'
      + '</style></head><body>\n'
      + '<h1>' + _esc(quiz.title || 'Bài Trắc Nghiệm') + '</h1>\n'
      + (quiz.description
          ? '<p style="font-size:11pt;color:#4b5563;font-style:italic;margin:4pt 0 8pt 0;">'
            + _esc(quiz.description) + '</p>\n' : '')
      + '<p class="meta">Số câu: <b>' + (quiz.questions || []).length + '</b>'
      + ' &nbsp;|&nbsp; Ngày tạo: ' + dateStr
      + ' &nbsp;|&nbsp; ' + (includeAnswers ? 'Có đáp án' : 'Không có đáp án') + '</p>\n'
      + qHTML + '\n</body></html>';

    var blob = new Blob(['\uFEFF' + html], { type: 'application/msword;charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = _filename(quiz.title) + '.doc';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }

  /* ─────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────── */

  var ExportManager = {

    /**
     * Xuất Word trực tiếp.
     *
     * @param {string|object} quizOrId
     * @param {boolean}       includeAnswers  (mặc định: true)
     */
    toWord: function (quizOrId, includeAnswers) {
      var quiz    = _resolve(quizOrId);
      if (!quiz)  { alert('Không tìm thấy bài trắc nghiệm!'); return; }
      var withAns = (includeAnswers === undefined || includeAnswers === null)
        ? true : !!includeAnswers;
      _renderWord(quiz, withAns);
    },

    /**
     * Render nút xuất Word vào một container.
     *
     * @param {Element|string} container  DOM element hoặc CSS selector
     * @param {string|object}  quizOrId   Quiz ID hoặc object quiz
     */
    renderExportButtons: function (container, quizOrId) {
      var el = (typeof container === 'string')
        ? document.querySelector(container)
        : container;
      if (!el) return;

      var self = this;

      el.innerHTML = [
        '<div style="',
          'border:1px solid var(--border,#e5e7eb);',
          'border-radius:10px;',
          'padding:12px 14px;',
          'background:var(--bg-surface-2,#f9f9ff);',
        '">',
          '<p style="',
            'margin:0 0 8px 0;font-size:0.75rem;font-weight:700;',
            'color:var(--text-muted,#9ca3af);',
            'letter-spacing:.06em;text-transform:uppercase;',
          '">📤 Xuất bài trắc nghiệm</p>',

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">',
            '<button data-ans="1"',
              ' class="btn btn-sm btn-outline _xbtn"',
              ' style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 8px;"',
              ' title="Xuất Word – bao gồm đáp án đúng">',
              '<span>📝 Word</span><span style="font-size:0.72em;font-weight:500;opacity:0.85;">Có đáp án</span>',
            '</button>',
            '<button data-ans="0"',
              ' class="btn btn-sm btn-secondary _xbtn"',
              ' style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 8px;"',
              ' title="Xuất Word – không có đáp án">',
              '<span>📝 Word</span><span style="font-size:0.72em;font-weight:500;opacity:0.85;">Không đáp án</span>',
            '</button>',
          '</div>',
        '</div>'
      ].join('');

      el.querySelectorAll('._xbtn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var withAn = this.getAttribute('data-ans') === '1';
          self.toWord(quizOrId, withAn);
        });
      });
    },

    /**
     * Mở modal chọn tuỳ chọn đáp án rồi xuất Word.
     *
     * @param {string|object} quizOrId
     */
    openExportModal: function (quizOrId) {
      var quiz = _resolve(quizOrId);
      if (!quiz) { alert('Không tìm thấy bài trắc nghiệm!'); return; }

      var self  = this;
      var modal = document.getElementById('__export-modal');

      /* Tạo modal lần đầu */
      if (!modal) {
        modal = document.createElement('div');
        modal.id        = '__export-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = [
          '<div class="modal" style="max-width:400px;">',
            '<div class="modal-header">',
              '<h3 style="margin:0;font-size:1.05rem;">📤 Xuất bài trắc nghiệm</h3>',
              '<button id="__exp-close" class="btn btn-icon btn-secondary" title="Đóng">✕</button>',
            '</div>',
            '<div class="modal-body">',
              '<p id="__exp-name" style="font-size:0.9rem;font-weight:500;',
                'color:var(--text-secondary);margin-bottom:18px;"></p>',

              '<p style="font-size:0.78rem;font-weight:700;color:var(--text-muted);',
                'letter-spacing:.05em;text-transform:uppercase;margin:0 0 8px 0;">',
                '📝 Xuất Word (.doc)</p>',
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">',
                '<button id="__exp-doc-y" class="btn btn-outline">Có đáp án</button>',
                '<button id="__exp-doc-n" class="btn btn-secondary">Không đáp án</button>',
              '</div>',
            '</div>',
          '</div>'
        ].join('');

        document.body.appendChild(modal);

        document.getElementById('__exp-close')
          .addEventListener('click', function () { modal.classList.remove('active'); });
        modal.addEventListener('click', function (e) {
          if (e.target === modal) modal.classList.remove('active');
        });
      }

      /* Cập nhật tên quiz */
      document.getElementById('__exp-name').textContent =
        '\u201C' + quiz.title + '\u201D \u2014 '
        + (quiz.questions || []).length + ' câu hỏi';

      /* Re-bind nút Word (clone để tránh duplicate listeners) */
      var btnMap = {
        '__exp-doc-y': function () { self.toWord(quiz, true);  },
        '__exp-doc-n': function () { self.toWord(quiz, false); }
      };
      Object.keys(btnMap).forEach(function (id) {
        var old = document.getElementById(id);
        if (!old) return;
        var neo = old.cloneNode(true);
        old.parentNode.replaceChild(neo, old);
        var handler = btnMap[id];
        neo.addEventListener('click', function () {
          modal.classList.remove('active');
          handler();
        });
      });

      modal.classList.add('active');
    },

    /* ── Alias giữ tương thích code cũ ── */
    exportWord:  function (q, o) { this.toWord(q, (o || {}).showAnswers !== false); },
    renderPanel: function (c, q) { this.renderExportButtons(c, q); },
    resolveQuiz: function (q)    { return _resolve(q); }
  };

  window.ExportManager = ExportManager;

})(window);
