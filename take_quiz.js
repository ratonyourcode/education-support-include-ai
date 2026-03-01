/**
 * take_quiz.js - Quiz Taking Logic
 * Hoạt động tốt với take_quiz.html
 */

(function () {
  'use strict';

  // ---- State ----
  let quiz = null;
  let currentIndex = 0;
  let answers = [];
  let mode = 'quiz'; // 'quiz' | 'results' | 'review'
  const LETTERS = ['A', 'B', 'C', 'D'];

  // ---- Init ----
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get('id');

    if (quizId) {
      quiz = loadQuizById(quizId);
      // Có ID nhưng không tìm thấy quiz → báo lỗi rõ ràng
      if (!quiz) {
        renderNotFound(quizId);
        return;
      }
    }

    // Không có ID trong URL → hiển thị thông báo, không dùng demo
    if (!quiz) {
      renderNoQuizSelected();
      return;
    }

    answers = new Array(quiz.questions.length).fill(null);
    render();
  }

  // Hiện thông báo khi quiz không tìm thấy
  function renderNotFound(quizId) {
    const area = document.getElementById('quiz-area');
    if (!area) return;
    area.innerHTML = `
      <div class="state-center">
        <div class="state-icon">❌</div>
        <h2 style="color:var(--text-primary);margin-bottom:0.5rem;">Không tìm thấy bài trắc nghiệm</h2>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;">
          Bài trắc nghiệm không tồn tại hoặc đã bị xóa.
        </p>
        <div style="display:flex;gap:var(--space-sm);justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="window.location.href='../quiz-list.html'">
            📋 Về danh sách
          </button>
          <button class="btn btn-secondary" onclick="window.location.href='../index.html'">
            ➕ Tạo quiz mới
          </button>
        </div>
      </div>`;
  }

  // Hiện thông báo khi không có quiz được chọn (không có ID trong URL)
  function renderNoQuizSelected() {
    const area = document.getElementById('quiz-area');
    if (!area) return;
    area.innerHTML = `
      <div class="state-center">
        <div class="state-icon">📋</div>
        <h2 style="color:var(--text-primary);margin-bottom:0.5rem;">Chưa chọn bài trắc nghiệm</h2>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;">
          Vui lòng chọn một bài quiz từ danh sách.
        </p>
        <div style="display:flex;gap:var(--space-sm);justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="window.location.href='../quiz-list.html'">
            📋 Xem danh sách quiz
          </button>
          <button class="btn btn-secondary" onclick="window.location.href='../index.html'">
            ➕ Tạo quiz mới
          </button>
        </div>
      </div>`;
  }

  function loadQuizById(id) {
    try {
      const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      return quizzes.find(q => q.id === id) || null;
    } catch { return null; }
  }

  // ---- Render router ----
  function render() {
    if (mode === 'quiz')    renderQuiz();
    else if (mode === 'results') renderResults();
    else if (mode === 'review')  renderReview();
  }

  // ========================
  // QUIZ MODE
  // ========================
  function renderQuiz() {
    const q = quiz.questions[currentIndex];
    const opts = getOptions(q);
    const progress = ((currentIndex + 1) / quiz.questions.length) * 100;
    const answered = answers.filter(a => a !== null).length;

    document.getElementById('quiz-area').innerHTML = `
      <!-- Quiz header -->
      <div class="quiz-header animate-slide-down">
        <div class="quiz-title">${esc(quiz.title || 'Bài trắc nghiệm')}</div>
        <div class="quiz-subtitle">${esc(quiz.description || '')}</div>
        <!-- Progress bar -->
        <div class="progress-wrapper">
          <div class="progress-fill" id="progress-fill" style="width:${progress}%"></div>
        </div>
        <div class="progress-meta">
          <span>Câu ${currentIndex + 1} / ${quiz.questions.length}</span>
          <span>${answered} đã trả lời</span>
        </div>
      </div>

      <!-- Question -->
      <div class="question-card">
        <div class="question-number-row">
          <span class="question-badge">Câu ${currentIndex + 1}</span>
          <span class="question-of">/ ${quiz.questions.length} câu hỏi</span>
        </div>
        <p class="question-text">${esc(q.question || q.text || '')}</p>

        <ul class="options-list" id="options-list">
          ${opts.map((opt, i) => {
            const sel = answers[currentIndex] === i;
            return `
              <li class="option-item ${sel ? 'selected' : ''}" onclick="selectAnswer(${i})">
                <span class="option-letter">${LETTERS[i]}</span>
                <span class="option-text">${esc(opt)}</span>
              </li>`;
          }).join('')}
        </ul>
      </div>

      <!-- Navigation -->
      <div class="nav-footer">
        <button class="btn btn-secondary" onclick="prevQuestion()" ${currentIndex === 0 ? 'disabled' : ''}>
          ← Câu trước
        </button>
        <div style="display:flex;gap:var(--space-sm);">
          ${currentIndex < quiz.questions.length - 1
            ? `<button class="btn btn-primary" onclick="nextQuestion()">Câu tiếp →</button>`
            : `<button class="btn btn-success" onclick="submitQuiz()">✓ Nộp bài</button>`
          }
        </div>
      </div>

      <!-- Question navigator dots -->
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:var(--space-lg);justify-content:center;">
        ${quiz.questions.map((_, i) => {
          let bg = 'var(--bg-surface-2)';
          let color = 'var(--text-muted)';
          if (i === currentIndex) { bg = 'var(--primary)'; color = '#fff'; }
          else if (answers[i] !== null) { bg = 'rgba(99,102,241,0.2)'; color = 'var(--primary)'; }
          return `<button onclick="jumpTo(${i})" style="
            width:32px;height:32px;border-radius:50%;border:2px solid ${i===currentIndex?'var(--primary)':'var(--border)'};
            background:${bg};color:${color};font-size:0.75rem;font-weight:600;cursor:pointer;
            transition:all 0.2s;">${i + 1}</button>`;
        }).join('')}
      </div>`;
  }

  // ========================
  // RESULTS MODE
  // ========================
  function renderResults() {
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      const ca = getCorrectAnswer(q);
      if (answers[i] === ca) correct++;
    });
    const total = quiz.questions.length;
    const pct = Math.round((correct / total) * 100);

    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (pct / 100) * circumference;

    const emoji  = pct >= 80 ? '🏆' : pct >= 60 ? '🎉' : pct >= 40 ? '💪' : '📚';
    const msg    = pct >= 80 ? 'Xuất sắc!' : pct >= 60 ? 'Tốt lắm!' : pct >= 40 ? 'Cố gắng hơn nhé!' : 'Cần ôn tập thêm!';

    document.getElementById('quiz-area').innerHTML = `
      <div class="results-card">
        <div style="font-size:3rem;margin-bottom:0.5rem;">${emoji}</div>
        <div class="results-title">${msg}</div>
        <div class="results-subtitle">Bạn đã hoàn thành bài trắc nghiệm</div>

        <!-- Score ring -->
        <div class="result-score-ring">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle class="ring-bg" cx="70" cy="70" r="54" stroke-dasharray="${circumference}" stroke-dashoffset="0"/>
            <circle class="ring-fill" cx="70" cy="70" r="54"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${circumference}"
              id="ring-fill-el"
            />
          </svg>
          <div class="result-score-num">${pct}%</div>
          <div class="result-score-label">điểm số</div>
        </div>

        <!-- Stats -->
        <div class="results-stats">
          <div class="result-stat">
            <div class="result-stat-num" style="color:var(--success);">${correct}</div>
            <div class="result-stat-label">Câu đúng</div>
          </div>
          <div class="result-stat">
            <div class="result-stat-num" style="color:var(--danger);">${total - correct}</div>
            <div class="result-stat-label">Câu sai</div>
          </div>
          <div class="result-stat">
            <div class="result-stat-num">${total}</div>
            <div class="result-stat-label">Tổng câu</div>
          </div>
        </div>

        <!-- Actions -->
        <div style="display:flex;gap:var(--space-sm);justify-content:center;flex-wrap:wrap;margin-bottom:var(--space-md);">
          <button class="btn btn-outline" onclick="reviewQuiz()">🔍 Xem đáp án</button>
          <button class="btn btn-primary" onclick="retakeQuiz()">🔄 Làm lại</button>
          <button class="btn btn-secondary" onclick="window.location.href='../quiz-list.html'">📋 Danh sách</button>
        </div>
        <!-- 4 nút xuất file — được render bởi ExportManager sau khi DOM ready -->
        <div id="result-export-buttons" style="margin-top:var(--space-md);max-width:500px;margin-left:auto;margin-right:auto;"></div>
      </div>`;

    // Animate ring
    setTimeout(() => {
      const el = document.getElementById('ring-fill-el');
      if (el) el.style.strokeDashoffset = offset;
    }, 200);

    // Render 4 nút xuất file vào container trong kết quả
    _renderResultExport();
  }

  // ========================
  // REVIEW MODE
  // ========================
  function renderReview() {
    const items = quiz.questions.map((q, i) => {
      const opts   = getOptions(q);
      const ca     = getCorrectAnswer(q);
      const ua     = answers[i];
      const isOk   = ua === ca;
      return `
        <div class="review-item ${isOk ? 'was-correct' : 'was-wrong'}">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-size:1.1rem;">${isOk ? '✅' : '❌'}</span>
            <span style="font-size:0.78rem;font-weight:700;color:${isOk?'var(--success)':'var(--danger)'};">
              Câu ${i + 1}
            </span>
          </div>
          <div class="review-q">${esc(q.question || q.text || '')}</div>

          <div class="review-answer-label">Bạn chọn:</div>
          <div class="review-answer-val ${isOk?'correct-ans':'wrong-ans'}">
            ${ua !== null ? `${LETTERS[ua]}. ${esc(opts[ua] || '')}` : 'Chưa trả lời'}
          </div>

          ${!isOk ? `
            <div class="review-answer-label">Đáp án đúng:</div>
            <div class="review-answer-val correct-ans">
              ${LETTERS[ca]}. ${esc(opts[ca] || '')}
            </div>` : ''}
        </div>`;
    }).join('');

    document.getElementById('quiz-area').innerHTML = `
      <div style="margin-bottom:var(--space-lg);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-sm);">
        <h2 style="margin:0;">🔍 Xem lại đáp án</h2>
        <button class="btn btn-primary" onclick="backToResults()">← Về kết quả</button>
      </div>
      <div class="stagger">${items}</div>`;
  }

  // ========================
  // ACTIONS
  // ========================
  window.selectAnswer = function (index) {
    answers[currentIndex] = index;
    // Sound: tick khi chọn
    if (window.SoundFX) SoundFX.select();
    // Ripple effect nhẹ
    var items = document.querySelectorAll('.option-item');
    var clicked = items[index];
    if (clicked) {
      clicked.classList.add('ripple');
      setTimeout(function () { clicked.classList.remove('ripple'); }, 350);
    }
    // Update option highlight without full re-render
    document.querySelectorAll('.option-item').forEach((el, i) => {
      el.classList.toggle('selected', i === index);
      el.querySelector('.option-letter').style.background = i === index ? 'var(--primary)' : '';
      el.querySelector('.option-letter').style.borderColor = i === index ? 'var(--primary)' : '';
      el.querySelector('.option-letter').style.color = i === index ? '#fff' : '';
    });
  };

  /* Helper: fade out → execute → fade in */
  function _fadeRender(fn) {
    var area = document.getElementById('quiz-area');
    if (area) {
      area.classList.add('fading');
      setTimeout(function () {
        fn();
        area.classList.remove('fading');
      }, 150);
    } else {
      fn();
    }
  }

  window.nextQuestion = function () {
    if (currentIndex < quiz.questions.length - 1) {
      if (window.SoundFX) SoundFX.navigate();
      currentIndex++;
      _fadeRender(function () {
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  window.prevQuestion = function () {
    if (currentIndex > 0) {
      if (window.SoundFX) SoundFX.navigate();
      currentIndex--;
      _fadeRender(function () {
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  window.jumpTo = function (i) {
    if (i !== currentIndex) {
      currentIndex = i;
      _fadeRender(render);
    }
  };

  window.submitQuiz = function () {
    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0) {
      if (!confirm(`Còn ${unanswered} câu chưa trả lời. Bạn có muốn nộp bài không?`)) return;
    }
    if (window.SoundFX) SoundFX.complete();
    mode = 'results';
    _fadeRender(function () {
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  window.reviewQuiz = function () {
    mode = 'review';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // BUG2 FIX: backToResults phải là window function vì được gọi từ inline onclick
  window.backToResults = function () {
    mode = 'results';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.retakeQuiz = function () {
    currentIndex = 0;
    answers = new Array(quiz.questions.length).fill(null);
    mode = 'quiz';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Gọi ngay sau khi renderResults() đặt HTML vào DOM
  function _renderResultExport() {
    var container = document.getElementById('result-export-buttons');
    if (container && window.ExportManager) {
      ExportManager.renderExportButtons(container, quiz);
    }
  }

  // Giữ lại exportResult để không phá code cũ nếu có nơi nào gọi
  window.exportResult = function () {
    if (window.ExportManager) {
      ExportManager.openExportModal(quiz);
    }
  };

  // ---- Keyboard shortcuts ----
  document.addEventListener('keydown', (e) => {
    if (mode !== 'quiz') return;
    if (e.key === 'ArrowRight' || (e.key === 'Enter' && !e.target.matches('input,textarea,button'))) {
      if (currentIndex < quiz.questions.length - 1) nextQuestion();
      else submitQuiz();
    }
    if (e.key === 'ArrowLeft') prevQuestion();
    if (['1','2','3','4'].includes(e.key)) selectAnswer(parseInt(e.key) - 1);
  });

  // ========================
  // HELPERS
  // ========================
  function getOptions(q) {
    if (q.options && q.options.length) return q.options;
    return [q.a, q.b, q.c, q.d].filter(v => v !== undefined && v !== null && v !== '');
  }

  function getCorrectAnswer(q) {
    if (typeof q.correctAnswer === 'number') return q.correctAnswer;
    if (typeof q.correct_answer === 'number') return q.correct_answer;
    if (typeof q.correctAnswer === 'string') {
      const idx = LETTERS.indexOf(q.correctAnswer.toUpperCase());
      return idx >= 0 ? idx : 0;
    }
    return 0;
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  // ========================
  // END
  // ========================

})();
