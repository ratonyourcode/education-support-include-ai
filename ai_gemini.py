"""
ai_gemini.py - Google Gemini AI Integration
"""

import os
import json
import logging
import re
import time
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-generativeai not installed")


class GeminiAI:
    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY', '').strip()
        self.model_name = None
        self._model = None
        self._usable_models = []

        if not GENAI_AVAILABLE:
            logger.warning("google-generativeai not installed")
            return

        if not self.api_key:
            logger.warning("Missing GEMINI_API_KEY")
            return

        try:
            genai.configure(api_key=self.api_key)

            models = genai.list_models()
            usable = [
                m.name for m in models
                if "generateContent" in m.supported_generation_methods
            ]

            if not usable:
                raise RuntimeError("Không có model nào hỗ trợ generateContent")

            self._usable_models = usable

            preferred_order = [
                "models/gemini-2.5-flash",
                "models/gemini-2.5-flash-lite",
                "models/gemini-2.5-pro",
            ]

            for pref in preferred_order:
                if pref in usable:
                    self.model_name = pref
                    break

            if not self.model_name:
                self.model_name = usable[0]

            self._model = genai.GenerativeModel(self.model_name)
            logger.info(f"Gemini AI initialized with model: {self.model_name}")
            logger.info(f"Available models: {self._usable_models}")

        except Exception as e:
            logger.error(f"Gemini init error: {e}")

    def test_connection(self) -> bool:
        """Kiểm tra kết nối AI có hoạt động không."""
        return self._model is not None

    def _call_model(self, model, prompt: str) -> str:
        """Gọi model và trả về text."""
        response = model.generate_content(
            prompt,
            generation_config={
                "max_output_tokens": 4096,
                "temperature": 0.7
            }
        )
        return response.text.strip()

    def _try_all_models(self, prompt: str) -> str:
        """Thử lần lượt tất cả model, fallback tự động khi quota hết."""
        models_to_try = [self.model_name] + [
            m for m in self._usable_models if m != self.model_name
        ]

        last_error = None
        for model_name in models_to_try:
            try:
                logger.info(f"Trying model: {model_name}")
                m = genai.GenerativeModel(model_name)
                return self._call_model(m, prompt)
            except Exception as e:
                error_str = str(e)
                last_error = e

                # Chỉ retry nếu là per-minute limit (không phải daily quota)
                is_daily_quota = "GenerateRequestsPerDayPerProjectPerModel" in error_str
                retry_seconds = None
                if not is_daily_quota and "retry_delay" in error_str:
                    match = re.search(r'seconds:\s*(\d+)', error_str)
                    if match:
                        retry_seconds = int(match.group(1))

                if retry_seconds is not None and retry_seconds <= 30:
                    logger.info(f"Per-minute limit on {model_name}, waiting {retry_seconds}s...")
                    time.sleep(retry_seconds + 1)
                    try:
                        m = genai.GenerativeModel(model_name)
                        return self._call_model(m, prompt)
                    except Exception as e2:
                        logger.warning(f"Retry on {model_name} failed: {e2}")
                        last_error = e2

                logger.warning(f"Model {model_name} failed, trying next... ({type(e).__name__})")

        raise RuntimeError(
            f"Tất cả model đều thất bại. Quota free tier có thể đã hết cho hôm nay. "
            f"Lỗi: {last_error}"
        )

    def generate_questions(self, subject: str, difficulty: str = 'medium',
                           count: int = 5, language: str = 'vi') -> list:
        if not self._model:
            raise RuntimeError("AI service không khả dụng. Kiểm tra GEMINI_API_KEY.")

        diff_map = {'easy': 'dễ (cơ bản)', 'medium': 'trung bình', 'hard': 'khó (nâng cao)'}
        diff_vi = diff_map.get(difficulty, 'trung bình')

        prompt = f"""Tạo {count} câu hỏi trắc nghiệm về chủ đề "{subject}".
Độ khó: {diff_vi}.
Ngôn ngữ: {"Tiếng Việt" if language == "vi" else "English"}.

Yêu cầu:
- Mỗi câu có đúng 4 lựa chọn (A, B, C, D)
- Chỉ có 1 đáp án đúng
- Câu hỏi rõ ràng, không mơ hồ
- Trả về JSON hợp lệ

Format JSON (không thêm markdown):
{{
  "questions": [
    {{
      "question": "Nội dung câu hỏi?",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correctAnswer": 0
    }}
  ]
}}

correctAnswer là index (0=A, 1=B, 2=C, 3=D)."""

        text = ""
        try:
            text = self._try_all_models(prompt)

            # Strip markdown code fences if present
            text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.MULTILINE)
            text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)

            data = json.loads(text)
            questions = data.get('questions', [])
            if not questions:
                raise ValueError("AI trả về dữ liệu rỗng")
            return self._normalize(questions)

        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}\nText: {text[:300]}")
            raise RuntimeError("AI trả về dữ liệu không hợp lệ, thử lại.")
        except Exception as e:
            logger.error(f"Generate error: {e}")
            raise RuntimeError(f"Lỗi tạo câu hỏi: {str(e)}")

    def _normalize(self, questions: list) -> list:
        result = []
        for q in questions:
            if not q.get('question') or not q.get('options'):
                continue
            result.append({
                'question': str(q['question']).strip(),
                'options': [str(o).strip() for o in q['options'][:4]],
                'correctAnswer': int(q.get('correctAnswer', 0))
            })
        return result
