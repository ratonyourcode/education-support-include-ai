"""
quiz_service.py - Quiz Data Layer
"""

import os
import json
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List, Dict, Tuple

logger = logging.getLogger(__name__)


class QuizService:
    def __init__(self, data_dir: str = None):
        if data_dir is None:
            base = Path(__file__).parent.parent
            data_dir = base / "data"
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.file = self.data_dir / "quizzes.json"
        if not self.file.exists():
            self.file.write_text('[]', encoding='utf-8')

    # ---- Read / Write ----
    def _load(self) -> List[Dict]:
        try:
            return json.loads(self.file.read_text(encoding='utf-8'))
        except Exception:
            return []

    def _save(self, quizzes: List[Dict]):
        self.file.write_text(json.dumps(quizzes, ensure_ascii=False, indent=2), encoding='utf-8')

    # ---- CRUD ----
    def get_all_quizzes(self) -> List[Dict]:
        return self._load()

    def get_quiz_by_id(self, quiz_id: str) -> Optional[Dict]:
        return next((q for q in self._load() if q.get('id') == quiz_id), None)

    def save_quiz(self, data: Dict) -> Dict:
        ok, err = self._validate(data)
        if not ok:
            raise ValueError(err)

        quizzes = self._load()
        now = datetime.now(timezone.utc).isoformat()

        if data.get('id'):
            idx = next((i for i, q in enumerate(quizzes) if q['id'] == data['id']), -1)
            if idx >= 0:
                quizzes[idx] = {**quizzes[idx], **data, 'updatedAt': now}
                self._save(quizzes)
                return quizzes[idx]

        quiz = {
            'id': str(uuid.uuid4()),
            'title': data['title'].strip(),
            'description': data.get('description', '').strip(),
            'questions': data['questions'],
            'createdAt': now,
            'updatedAt': now
        }
        quizzes.append(quiz)
        self._save(quizzes)
        return quiz

    def delete_quiz(self, quiz_id: str) -> bool:
        quizzes = self._load()
        new = [q for q in quizzes if q['id'] != quiz_id]
        if len(new) == len(quizzes):
            return False
        self._save(new)
        return True

    def _validate(self, data: Dict) -> Tuple[bool, Optional[str]]:
        if not data.get('title', '').strip():
            return False, 'Tiêu đề không được để trống'
        if not data.get('questions'):
            return False, 'Bài trắc nghiệm phải có ít nhất 1 câu hỏi'
        return True, None
