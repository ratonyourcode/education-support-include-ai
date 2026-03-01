/**
 * quiz.js - Quiz Data Management
 */

class QuizManager {
  constructor() {
    this.STORAGE_KEY = 'quizzes';
    this.currentQuiz = {
      title: '',
      description: '',
      questions: []
    };
    this.editingIndex = null;
  }

  // ---- LocalStorage ----
  getAllQuizzes() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch { return []; }
  }

  getQuizById(id) {
    return this.getAllQuizzes().find(q => q.id === id) || null;
  }

  saveQuizToStorage(quiz) {
    const quizzes = this.getAllQuizzes();
    const idx = quizzes.findIndex(q => q.id === quiz.id);
    if (idx >= 0) quizzes[idx] = quiz;
    else quizzes.push(quiz);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(quizzes));
  }

  deleteQuizFromStorage(id) {
    const quizzes = this.getAllQuizzes().filter(q => q.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(quizzes));
  }

  generateId() {
    return 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  // ---- Current quiz editing ----
  setTitle(title) { this.currentQuiz.title = title; }
  setDescription(desc) { this.currentQuiz.description = desc; }

  addQuestion(q) {
    this.currentQuiz.questions.push({ ...q, id: Date.now() });
  }

  updateQuestion(index, q) {
    if (index >= 0 && index < this.currentQuiz.questions.length) {
      this.currentQuiz.questions[index] = { ...this.currentQuiz.questions[index], ...q };
    }
  }

  deleteQuestion(index) {
    this.currentQuiz.questions.splice(index, 1);
  }

  saveCurrentQuiz() {
    if (!this.currentQuiz.title.trim()) {
      throw new Error('Vui lòng nhập tiêu đề bài trắc nghiệm');
    }
    if (this.currentQuiz.questions.length === 0) {
      throw new Error('Vui lòng thêm ít nhất 1 câu hỏi');
    }
    const quiz = {
      ...this.currentQuiz,
      id: this.currentQuiz.id || this.generateId(),
      createdAt: this.currentQuiz.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.saveQuizToStorage(quiz);
    return quiz;
  }

  resetCurrentQuiz() {
    this.currentQuiz = { title: '', description: '', questions: [] };
    this.editingIndex = null;
  }

  loadQuizForEdit(id) {
    const quiz = this.getQuizById(id);
    if (quiz) this.currentQuiz = { ...quiz };
    return quiz;
  }

  // ---- Backend sync (optional) ----
  async syncToBackend(quiz) {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quiz)
      });
      return res.ok;
    } catch { return false; }
  }
}

window.QuizManager = new QuizManager();
