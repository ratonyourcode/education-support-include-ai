"""
server.py - Flask API Server
"""

import os
import json
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from ai_gemini import GeminiAI
from quiz_service import QuizService

# ---- Setup ----
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

CORS(app, origins=[
    "http://localhost:8080", "http://127.0.0.1:8080",
    "http://localhost:5500", "http://127.0.0.1:5500",
    "http://localhost:3000", "http://127.0.0.1:3000",
    "null"  # for file:// protocol during dev
], supports_credentials=True)

ai_service   = GeminiAI()
quiz_service = QuizService()


# ---- Health ----
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "message": "Quiz AI API is running"})


@app.route('/api/test-ai', methods=['GET'])
def test_ai():
    ok = ai_service.test_connection()
    if ok:
        return jsonify({"success": True, "message": "AI connection successful"})
    return jsonify({"success": False, "message": "AI not available"}), 503


# ---- Generate questions ----
@app.route('/api/generate-questions', methods=['POST'])
def generate_questions():
    data = request.get_json(silent=True) or {}
    subject    = data.get('subject', '').strip()
    difficulty = data.get('difficulty', 'medium')
    count      = min(max(int(data.get('count', 5)), 1), 20)
    language   = data.get('language', 'vi')

    if not subject:
        return jsonify({"error": "Vui lòng nhập chủ đề"}), 400

    try:
        questions = ai_service.generate_questions(subject, difficulty, count, language)
        return jsonify({"questions": questions, "count": len(questions)})
    except Exception as e:
        logger.error(f"Generate error: {e}")
        return jsonify({"error": str(e)}), 500


# ---- Quiz CRUD ----
@app.route('/api/quiz', methods=['POST'])
def save_quiz():
    data = request.get_json(silent=True) or {}
    try:
        quiz = quiz_service.save_quiz(data)
        return jsonify({"success": True, "quiz": quiz}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Save error: {e}")
        return jsonify({"error": "Lỗi lưu bài"}), 500


@app.route('/api/quiz', methods=['GET'])
def get_quizzes():
    quizzes = quiz_service.get_all_quizzes()
    return jsonify({"quizzes": quizzes, "total": len(quizzes)})


@app.route('/api/quiz/<quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        return jsonify({"error": "Không tìm thấy bài trắc nghiệm"}), 404
    return jsonify(quiz)


@app.route('/api/quiz/<quiz_id>', methods=['DELETE'])
def delete_quiz(quiz_id):
    ok = quiz_service.delete_quiz(quiz_id)
    if not ok:
        return jsonify({"error": "Không tìm thấy bài"}), 404
    return jsonify({"success": True})


@app.route('/api/statistics', methods=['GET'])
def statistics():
    quizzes = quiz_service.get_all_quizzes()
    total_q = sum(len(q.get('questions', [])) for q in quizzes)
    return jsonify({
        "total_quizzes": len(quizzes),
        "total_questions": total_q,
    })


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting Quiz AI API on port {port}")
    app.run(host="0.0.0.0", port=port)
