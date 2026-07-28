# -*- coding: utf-8 -*-
"""
White-box Unit Tests: Chat Attachment Sanitizer (100% Branch Coverage)
"""
import pytest
from chat_sanitizer_engine import ChatSanitizerEngine, FileSecurityException

class TestChatAttachmentValidator:
    """Bộ kiểm thử bảo mật tải tệp đính kèm trong Real-time Chat."""

    @pytest.mark.parametrize("fname,size,mime", [
        ("baitap_toan.pdf", 500000, "application/pdf"),
        ("hinh_anh_lop_hoc.png", 2000000, "image/png"),
        ("de_thi_hoc_ki.docx", 1500000, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        ("ghichu_nguvăn.txt", 10000, "text/plain"),
    ])
    def test_valid_attachments_approved(self, fname, size, mime):
        res = ChatSanitizerEngine.validate_chat_attachment(fname, size, mime)
        assert res["status"] == "approved"
        assert res["filename"] == fname
        assert "Tệp tin đạt yêu cầu bảo mật" in res["message"]

    def test_file_size_exceeding_25_mb_rejected(self):
        huge_size = (25 * 1024 * 1024) + 100  # 25 MB + 100 bytes
        with pytest.raises(FileSecurityException, match=r"vượt quá giới hạn cho phép \(25 MB\)"):
            ChatSanitizerEngine.validate_chat_attachment("video_bai_giang.mp4", huge_size, "image/mp4")

    @pytest.mark.parametrize("dangerous_fname", [
        "virus_payload.exe",
        "script_attack.sh",
        "rm_all_files.bat",
        "hack_db.php",
        "xss_steal_cookie.js",
        "auto_install.cmd",
    ])
    def test_dangerous_executable_extensions_blocked(self, dangerous_fname):
        with pytest.raises(FileSecurityException, match="Phần mở rộng tệp tin '.*' bị cấm tải lên hệ thống"):
            ChatSanitizerEngine.validate_chat_attachment(dangerous_fname, 10000, "text/plain")

    def test_unsupported_mime_type_rejected(self):
        with pytest.raises(FileSecurityException, match="Định dạng tệp 'audio/mpeg' không được hỗ trợ"):
            ChatSanitizerEngine.validate_chat_attachment("bai_hat.mp3", 3000000, "audio/mpeg")

    @pytest.mark.parametrize("fname,size,mime,err_msg", [
        (None, 50000, "application/pdf", "Tên tệp tin không hợp lệ"),
        ("", 50000, "application/pdf", "Tên tệp tin không hợp lệ"),
        (12345, 50000, "application/pdf", "Tên tệp tin không hợp lệ"),
        ("file.pdf", 0, "application/pdf", "Dung lượng tệp tin phải là số byte dương"),
        ("file.pdf", -500, "application/pdf", "Dung lượng tệp tin phải là số byte dương"),
        ("file.pdf", "1000", "application/pdf", "Dung lượng tệp tin phải là số byte dương"),
        ("file.pdf", 50000, None, "MIME type không hợp lệ"),
        ("file.pdf", 50000, "", "MIME type không hợp lệ"),
        ("file.pdf", 50000, 123, "MIME type không hợp lệ"),
    ])
    def test_invalid_arguments_raise_exceptions(self, fname, size, mime, err_msg):
        with pytest.raises(ValueError, match=err_msg):
            ChatSanitizerEngine.validate_chat_attachment(fname, size, mime)
