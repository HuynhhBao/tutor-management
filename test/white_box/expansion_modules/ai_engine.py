# -*- coding: utf-8 -*-
"""
Module: AI Matchmaker Core Engine (Sanitization & Cosine Similarity)
Bộ máy phân tích Ngữ nghĩa và tính Điểm phù hợp Gia Sư AI.
"""
import re
import math

class SecurityException(Exception):
    """Ngoại lệ phát ra khi phát hiện nguy cơ tấn công XSS hoặc Script Injection trong Prompt AI."""
    pass


class AIMatchmakerEngine:
    """Mô phỏng động cơ AI Trợ lý tìm gia sư EduMatch."""
    
    XSS_REGEX = r"(\<\/?script|\<\/?iframe|javascript:|onload=|onerror=|\<\/?html|\<\/?body|\<\/?style)"

    @classmethod
    def sanitize_user_prompt(cls, prompt: str) -> str:
        """Lọc bỏ mã độc và kiểm duyệt an toàn trước khi gửi vào LLM Engine."""
        if not prompt or not isinstance(prompt, str) or not prompt.strip():
            raise ValueError("Prompt câu lệnh tìm gia sư không được rỗng")
        
        # Phát hiện XSS / Prompt Injection
        if re.search(cls.XSS_REGEX, prompt, re.IGNORECASE):
            raise SecurityException("Cảnh báo an ninh: Phát hiện mã độc Injection trong câu lệnh tìm gia sư!")
            
        clean = re.sub(r"\s+", " ", prompt).strip()
        return clean

    @classmethod
    def extract_semantic_intents(cls, prompt: str) -> dict:
        """Bốc tách từ khóa Môn học, Cấp lớp và Học phí tối đa mong muốn từ Câu truy vấn văn bản tự nhiên."""
        sanitized = cls.sanitize_user_prompt(prompt)
        lower = sanitized.lower()
        
        intents = {
            "subject": None,
            "grade": None,
            "max_budget": None,
            "raw_prompt": sanitized
        }
        
        # Nhận dạng Môn học
        if any(k in lower for k in ["toán", "math"]):
            intents["subject"] = "Toán"
        elif any(k in lower for k in ["anh", "tiếng anh", "english", "ielts", "toeic"]):
            intents["subject"] = "Tiếng Anh"
        elif any(k in lower for k in ["văn", "ngữ văn", "literature"]):
            intents["subject"] = "Ngữ Văn"
        elif any(k in lower for k in ["lý", "vật lý"]):
            intents["subject"] = "Vật Lý"
        elif any(k in lower for k in ["hóa", "hóa học"]):
            intents["subject"] = "Hóa Học"
            
        # Nhận dạng Cấp lớp
        grade_match = re.search(r"(lớp|grade|cấp)\s*([0-9]{1,2})", lower)
        if grade_match:
            intents["grade"] = f"Lớp {grade_match.group(2)}"
        elif "đại học" in lower or "university" in lower:
            intents["grade"] = "Đại Học"
            
        # Nhận dạng Học phí mong muốn
        fee_match = re.search(r"dưới\s*([0-9]+)\s*(k|nghìn|trăm|000|tr|triệu)", lower)
        if fee_match:
            num = int(fee_match.group(1))
            unit = fee_match.group(2)
            if unit in ["k", "nghìn", "trăm", "000"]:
                intents["max_budget"] = num * 1000 if num < 1000 else num
            else:  # Đơn vị tr hoặc triệu (được đảm bảo bởi Regex)
                intents["max_budget"] = num * 1000000
                
        return intents

    @classmethod
    def calculate_match_score(cls, tutor: dict, intents: dict) -> float:
        """Tính điểm độ tương đồng (Cosine / Weighted Similarity Score) từ 0.0 đến 1.0."""
        if not isinstance(tutor, dict) or not isinstance(intents, dict):
            raise ValueError("Tham số đầu vào cho thuật toán xếp hạng không hợp lệ")

        score = 0.0
        
        # Tiêu chí 1: Trùng Môn Học (Trọng số cao nhất = 50% / 0.5)
        if intents.get("subject") and intents["subject"] in str(tutor.get("subject", "")):
            score += 0.5
            
        # Tiêu chí 2: Trùng Cấp Lớp (Trọng số 25% / 0.25)
        if intents.get("grade") and intents["grade"] in str(tutor.get("gradeLevels", "")):
            score += 0.25
            
        # Tiêu chí 3: Giá Tiền Trong Hạn Mức Budget (Trọng số 15% / 0.15)
        tutor_fee = tutor.get("hourlyRate", 99999999)
        max_budget = intents.get("max_budget")
        if max_budget and tutor_fee <= max_budget:
            score += 0.15
            
        # Tiêu chí 4: Thăng hạng theo Đánh giá Rating Sao (Trọng số 10% / 0.10)
        rating = tutor.get("rating", 0.0)
        score += (rating / 5.0) * 0.10
        
        return round(min(score, 1.0), 4)
