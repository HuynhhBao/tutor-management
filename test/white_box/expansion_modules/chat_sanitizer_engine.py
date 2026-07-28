# -*- coding: utf-8 -*-
"""
Module: Real-time Chat Attachment Security & Sanitizer Engine
Bộ lọc bảo mật, ngăn cản tệp tin nguy hiểm và kiểm tra dung lượng tệp tải lên Chat.
"""
import os

class FileSecurityException(Exception):
    """Ngoại lệ ném ra khi cố tình tải lên tệp tin độc hại hoặc vượt quá dung lượng quy định."""
    pass


class ChatSanitizerEngine:
    """Bộ kiểm thử tệp đính kèm trong Real-time Chat."""

    MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
    DANGEROUS_EXTENSIONS = [".exe", ".sh", ".bat", ".vbs", ".php", ".js", ".cmd", ".scr", ".com"]
    ALLOWED_MIME_PREFIXES = ["image/", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument", "text/plain"]

    @classmethod
    def validate_chat_attachment(cls, filename: str, size_in_bytes: int, mime_type: str) -> dict:
        """
        Kiểm toán tệp tải lên:
        - Kích thước không quá 25 MB.
        - Chấm dứt tệp tin có extension khả nghi (.exe, .sh, ...).
        - Kiểm duyệt MIME Type hợp lệ cho học liệu.
        """
        if not filename or not isinstance(filename, str):
            raise ValueError("Tên tệp tin không hợp lệ")
        if not isinstance(size_in_bytes, int) or size_in_bytes <= 0:
            raise ValueError("Dung lượng tệp tin phải là số byte dương")
        if not mime_type or not isinstance(mime_type, str):
            raise ValueError("MIME type không hợp lệ")

        if size_in_bytes > cls.MAX_FILE_SIZE_BYTES:
            raise FileSecurityException(f"Tệp tin '{filename}' vượt quá giới hạn cho phép (25 MB)")

        ext = os.path.splitext(filename.lower())[1]
        if ext in cls.DANGEROUS_EXTENSIONS:
            raise FileSecurityException(f"Cảnh báo bảo mật: Phần mở rộng tệp tin '{ext}' bị cấm tải lên hệ thống!")

        is_allowed_mime = any(mime_type.startswith(prefix) for prefix in cls.ALLOWED_MIME_PREFIXES)
        if not is_allowed_mime:
            raise FileSecurityException(f"Định dạng tệp '{mime_type}' không được hỗ trợ để chia sẻ học liệu")

        return {
            "filename": filename,
            "size_kb": round(size_in_bytes / 1024.0, 2),
            "mime_type": mime_type,
            "status": "approved",
            "message": "Tệp tin đạt yêu cầu bảo mật và sẵn sàng truyền phát."
        }
