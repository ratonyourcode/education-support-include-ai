/**
 * ai.js - AI Question Generation Service
 */

class AIService {
  constructor() {
    this.baseURL = 'http://127.0.0.1:5000/api';
    this._generating = false;
    this._lastRequest = 0;
    this._cooldown = 1500; // ms
  }

  async checkHealth() {
    try {
      const res = await fetch(`${this.baseURL}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch { return false; }
  }

  async generateQuestions({ subject, difficulty = 'medium', count = 5, language = 'vi' }) {
    if (this._generating) throw new Error('Đang tạo câu hỏi, vui lòng chờ...');
    const now = Date.now();
    if (now - this._lastRequest < this._cooldown) {
      throw new Error('Vui lòng chờ một chút trước khi tạo lại');
    }

    this._generating = true;
    this._lastRequest = now;

    try {
      // Timeout 90s để đủ thời gian cho retry/fallback model
      const res = await fetch(`${this.baseURL}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, difficulty, count, language }),
        signal: AbortSignal.timeout(90000)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Lấy error message đúng field từ backend
        throw new Error(data.error || data.message || `Lỗi server: ${res.status}`);
      }

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Dữ liệu trả về không hợp lệ');
      }
      return data.questions;
    } finally {
      this._generating = false;
    }
  }
}

window.AIService = new AIService();
