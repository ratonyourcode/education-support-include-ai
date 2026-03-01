/**
 * main.js - Main Page Controller (index.html)
 */

document.addEventListener('DOMContentLoaded', function () {
  const qm = window.QuizManager;
  const ui = window.UI;

  // ---- DOM Refs ----
  const titleInput   = document.getElementById('quiz-title');
  const descInput    = document.getElementById('quiz-description');
  const questionsEl  = document.getElementById('questions-list');
  const questionCount = document.getElementById('question-count');
  const saveBtn      = document.getElementById('btn-save');
  const addBtn       = document.getElementById('btn-add-question');
  const aiBtn        = document.getElementById('btn-ai');
  const resetBtn     = document.getElementById('btn-reset');

  // AI Modal
  const aiModal      = document.getElementById('ai-modal');
  const aiSubject    = document.getElementById('ai-subject');
  const aiDiff       = document.getElementById('ai-difficulty');
  const aiCount      = document.getElementById('ai-count');
  const aiGenBtn     = document.getElementById('btn-ai-generate');
  const aiCloseBtn   = document.getElementById('btn-ai-close');

  // Question Modal
  const qModal       = document.getElementById('question-modal');
  const qText        = document.getElementById('q-text');
  const qOptions     = [0,1,2,3].map(i => document.getElementById(`q-opt-${i}`));
  const qCorrect     = document.getElementById('q-correct');
  const qSaveBtn     = document.getElementById('btn-q-save');
  const qCloseBtn    = document.getElementById('btn-q-close');

  let editingIndex = null;

  // ---- Render Questions ----
  function renderQuestions() {
    const qs = qm.currentQuiz.questions;
    if (questionCount) questionCount.textContent = qs.length;

    if (!questionsEl) return;
    if (qs.length === 0) {
      questionsEl.innerHTML = `
        <div class="empty-state" style="text-align:center;padding:3rem;color:var(--text-muted);">
          <div style="font-size:3rem;margin-bottom:1rem;">📝</div>
          <p>Chưa có câu hỏi nào. Hãy thêm câu hỏi hoặc dùng AI tạo tự động!</p>
        </div>`;
      return;
    }

    const letters = ['A','B','C','D'];
    questionsEl.innerHTML = qs.map((q, i) => {
      const opts = q.options || [q.a, q.b, q.c, q.d].filter(Boolean);
      const optHTML = opts.map((o, oi) => {
        const isCorrect = q.correctAnswer === oi || q.correct_answer === oi;
        return `<span class="opt-chip ${isCorrect ? 'correct' : ''}">${letters[oi]}. ${ui.escapeHtml(o || '')}</span>`;
      }).join('');
      return `
        <div class="question-card animate-slide-up" data-index="${i}">
          <div class="question-header">
            <span class="question-num">${i + 1}</span>
            <p class="question-text">${ui.escapeHtml(q.question || q.text || '')}</p>
            <div class="question-actions">
              <button class="btn btn-sm btn-outline" onclick="editQuestion(${i})">✏️ Sửa</button>
              <button class="btn btn-sm btn-danger"  onclick="deleteQuestion(${i})">🗑️</button>
            </div>
          </div>
          <div class="options-row">${optHTML}</div>
        </div>`;
    }).join('');
  }

  // ---- Add / Edit Question ----
  window.editQuestion = function (index) {
    editingIndex = index;
    const q = qm.currentQuiz.questions[index];
    if (!q) return;
    const opts = q.options || [q.a, q.b, q.c, q.d].filter(Boolean);
    if (qText)  qText.value = q.question || q.text || '';
    qOptions.forEach((el, i) => { if (el) el.value = opts[i] || ''; });
    const correct = q.correctAnswer ?? q.correct_answer ?? 0;
    if (qCorrect) qCorrect.value = correct;
    document.getElementById('q-modal-title').textContent = 'Chỉnh sửa câu hỏi';
    ui.openModal('question-modal');
  };

  window.deleteQuestion = function (index) {
    if (!confirm('Xóa câu hỏi này?')) return;
    qm.deleteQuestion(index);
    renderQuestions();
    ui.success('Đã xóa câu hỏi');
  };

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      editingIndex = null;
      if (qText) qText.value = '';
      qOptions.forEach(el => { if (el) el.value = ''; });
      if (qCorrect) qCorrect.value = '0';
      document.getElementById('q-modal-title').textContent = 'Thêm câu hỏi';
      ui.openModal('question-modal');
    });
  }

  if (qSaveBtn) {
    qSaveBtn.addEventListener('click', () => {
      const text = qText ? qText.value.trim() : '';
      if (!text) { ui.error('Vui lòng nhập nội dung câu hỏi'); return; }
      const opts = qOptions.map(el => el ? el.value.trim() : '');
      if (opts.some(o => !o)) { ui.error('Vui lòng điền đầy đủ 4 đáp án'); return; }
      const correct = parseInt(qCorrect ? qCorrect.value : 0);

      const qData = { question: text, options: opts, correctAnswer: correct };

      if (editingIndex !== null) {
        qm.updateQuestion(editingIndex, qData);
        ui.success('Đã cập nhật câu hỏi');
      } else {
        qm.addQuestion(qData);
        ui.success('Đã thêm câu hỏi');
      }
      ui.closeModal('question-modal');
      renderQuestions();
    });
  }

  if (qCloseBtn) qCloseBtn.addEventListener('click', () => ui.closeModal('question-modal'));
  ui.closeModalOnOverlayClick('question-modal');

  // ---- Save Quiz ----
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (titleInput) qm.setTitle(titleInput.value.trim());
      if (descInput)  qm.setDescription(descInput.value.trim());
      try {
        ui.showLoading(saveBtn, 'Đang lưu...');
        const quiz = qm.saveCurrentQuiz();
        await qm.syncToBackend(quiz).catch(() => {});
        ui.success('✅ Đã lưu bài trắc nghiệm!');

        // BUG2 FIX: Cập nhật nút "Làm bài" ở header với ID của quiz vừa lưu
        const playBtn = document.getElementById('btn-play-quiz');
        if (playBtn) {
          playBtn.onclick = function () {
            window.location.href = 'takequiz/take_quiz.html?id=' + quiz.id;
          };
          playBtn.title = 'Làm bài: ' + (quiz.title || quiz.id);
        }

        // Hiện 4 nút xuất file cho quiz vừa lưu
        if (window.ExportManager) {
          const exportWrap = document.getElementById('sidebar-export');
          const exportCont = document.getElementById('sidebar-export-container');
          if (exportWrap) exportWrap.style.display = '';
          if (exportCont) ExportManager.renderExportButtons(exportCont, quiz);
        }

        qm.resetCurrentQuiz();
        renderQuestions();
        if (titleInput) titleInput.value = '';
        if (descInput)  descInput.value = '';
      } catch (err) {
        ui.error(err.message);
      } finally {
        ui.hideLoading(saveBtn);
      }
    });
  }

  // ---- Reset ----
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!confirm('Xóa toàn bộ dữ liệu đang nhập?')) return;
      qm.resetCurrentQuiz();
      if (titleInput) titleInput.value = '';
      if (descInput)  descInput.value = '';
      renderQuestions();
      ui.info('Đã xóa dữ liệu');
    });
  }

  // ---- AI Modal ----
  if (aiBtn) {
    aiBtn.addEventListener('click', () => ui.openModal('ai-modal'));
  }
  if (aiCloseBtn) aiCloseBtn.addEventListener('click', () => ui.closeModal('ai-modal'));
  ui.closeModalOnOverlayClick('ai-modal');

  if (aiGenBtn) {
    aiGenBtn.addEventListener('click', async () => {
      const subject = aiSubject ? aiSubject.value.trim() : '';
      if (!subject) { ui.error('Vui lòng nhập chủ đề'); return; }
      const difficulty = aiDiff ? aiDiff.value : 'medium';
      const count = aiCount ? parseInt(aiCount.value) || 5 : 5;

      const healthy = await window.AIService.checkHealth();
      if (!healthy) {
        ui.error('❌ Backend chưa chạy. Hãy khởi động server!');
        return;
      }

      ui.showLoading(aiGenBtn, 'AI đang tạo...');
      try {
        const questions = await window.AIService.generateQuestions({ subject, difficulty, count });
        questions.forEach(q => qm.addQuestion(q));
        ui.closeModal('ai-modal');
        renderQuestions();
        ui.success(`✅ Đã thêm ${questions.length} câu hỏi từ AI!`);
      } catch (err) {
        ui.error(`❌ ${err.message}`);
      } finally {
        ui.hideLoading(aiGenBtn);
      }
    });
  }

  // ---- Keyboard shortcuts ----
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveBtn && saveBtn.click(); }
    // BUG4 FIX: Ctrl+N bị trình duyệt bắt ở OS-level (mở cửa sổ mới), không thể override.
    // Dùng Ctrl+Q (Add Question) thay thế — không xung đột với browser.
    if (e.ctrlKey && e.key === 'q') { e.preventDefault(); addBtn && addBtn.click(); }
    if (e.key === 'Escape') {
      ui.closeModal('ai-modal');
      ui.closeModal('question-modal');
    }
  });

  // ---- Init ----
  renderQuestions();
});
