# -*- coding: utf-8 -*-
"""
White-box Unit Tests: AI Semantic Parser & Prompt Sanitization (100% Branch Coverage)
"""
import pytest
from ai_engine import AIMatchmakerEngine, SecurityException

class TestAIMatchmakerWhiteBox:
    """Bộ kiểm thử cho bộ não Trợ lý tìm gia sư AI."""

    @pytest.mark.parametrize("malicious_prompt", [
        "Tìm gia sư Toán <script>alert('XSS Attack!')</script>",
        "Tìm cô giáo dạy Văn <iframe src='http://evil.com'></iframe>",
        "Gia sư Tiếng Anh onload=alert('hack')",
        "Tìm gia sư javascript:eval('malicious_code')",
        "Học bồi dưỡng Lý <html><body>Bad injection</body></html>",
        "Gia sư Hóa <style>body{background:red}</style>",
    ])
    def test_prompt_sanitization_xss_prevention(self, malicious_prompt):
        with pytest.raises(SecurityException, match="Cảnh báo an ninh: Phát hiện mã độc Injection"):
            AIMatchmakerEngine.sanitize_user_prompt(malicious_prompt)

    @pytest.mark.parametrize("empty_prompt", [None, "", "    "])
    def test_empty_prompt_raises_exception(self, empty_prompt):
        with pytest.raises(ValueError, match="Prompt câu lệnh tìm gia sư không được rỗng"):
            AIMatchmakerEngine.sanitize_user_prompt(empty_prompt)

    def test_extract_semantic_intents_all_subject_and_grade_branches(self):
        """Kiểm nghiệm 100% nhánh nhận dạng Môn học, Cấp lớp và Giá tiền trong extract_semantic_intents."""
        res1 = AIMatchmakerEngine.extract_semantic_intents("Tôi muốn tìm gia sư dạy Toán lớp 12 giá dưới 300 k")
        assert res1["subject"] == "Toán" and res1["grade"] == "Lớp 12" and res1["max_budget"] == 300000

        res2 = AIMatchmakerEngine.extract_semantic_intents("Cô giáo dạy English luyện IELTS cho viên sinh Đại học dưới 2 triệu")
        assert res2["subject"] == "Tiếng Anh" and res2["grade"] == "Đại Học" and res2["max_budget"] == 2000000

        res3 = AIMatchmakerEngine.extract_semantic_intents("Tìm người dạy Ngữ văn cấp 9 dưới 250000")
        assert res3["subject"] == "Ngữ Văn" and res3["grade"] == "Lớp 9" and res3["max_budget"] == 250000

        res4 = AIMatchmakerEngine.extract_semantic_intents("Cần tìm thầy dạy Vật Lý lớp 10 dưới 200 nghìn")
        assert res4["subject"] == "Vật Lý" and res4["grade"] == "Lớp 10" and res4["max_budget"] == 200000

        res5 = AIMatchmakerEngine.extract_semantic_intents("Gia sư Hóa học lớp 11 dưới 1 tr/buổi")
        assert res5["subject"] == "Hóa Học" and res5["grade"] == "Lớp 11" and res5["max_budget"] == 1000000

        res6 = AIMatchmakerEngine.extract_semantic_intents("Học kỹ năng nói chuyện tự do không giới hạn học phí")
        assert res6["subject"] is None and res6["grade"] is None and res6["max_budget"] is None

        res7 = AIMatchmakerEngine.extract_semantic_intents("Tìm gia sư Toán lớp 12 giá dưới 1500000 k")
        assert res7["max_budget"] == 1500000

    def test_similarity_scoring_algorithm_branches(self):
        tutors = [
            {"fullName": "An", "subject": "Toán, Lý", "gradeLevels": "Lớp 10, Lớp 11, Lớp 12", "hourlyRate": 250000, "rating": 5.0},
            {"fullName": "Binh", "subject": "Tiếng Anh", "gradeLevels": "Lớp 9", "hourlyRate": 400000, "rating": 3.0},
        ]
        intents = {"subject": "Toán", "grade": "Lớp 12", "max_budget": 300000}
        
        score_an = AIMatchmakerEngine.calculate_match_score(tutors[0], intents)
        score_binh = AIMatchmakerEngine.calculate_match_score(tutors[1], intents)

        assert score_an == 1.0  # 0.5 + 0.25 + 0.15 + (5.0/5)*0.1 = 1.0
        assert score_binh == 0.06  # Chỉ có điểm rating (3.0/5)*0.1 = 0.06
        assert score_an > score_binh

    def test_calculate_match_score_invalid_inputs(self):
        with pytest.raises(ValueError, match="Tham số đầu vào cho thuật toán xếp hạng không hợp lệ"):
            AIMatchmakerEngine.calculate_match_score("not_a_dict", {})
        with pytest.raises(ValueError, match="Tham số đầu vào cho thuật toán xếp hạng không hợp lệ"):
            AIMatchmakerEngine.calculate_match_score({}, None)
