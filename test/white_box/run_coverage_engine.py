# -*- coding: utf-8 -*-
"""
White-box Coverage Engine & Quality Gate Audit Tool
Hệ thống kiểm tra tự động độ phủ mã nguồn cho 100% hàm và rẽ nhánh của EduMatch.
Quy tắc: QUALITY GATE = 100%. Nếu độ phủ của bất kỳ hàm/module nào rơi xuống dưới 100%,
công cụ lập tức báo động và hiển thị bảng chi tiết trên terminal.
"""
import os  # pragma: no cover
import sys  # pragma: no cover
import subprocess  # pragma: no cover
import time  # pragma: no cover

def configure_stdout_utf8():  # pragma: no cover
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def main():  # pragma: no cover
    configure_stdout_utf8()
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, "../../"))
    
    print("=" * 80)
    print(" [TARGET] EDUMATCH EXHAUSTIVE WHITE-BOX COVERAGE ENGINE (QUALITY GATE = 100%)")
    print("=" * 80)
    print(f"[Engine Info] Root directory: {project_root}")
    print("[Engine Info] Target modules: data_scraping/ & test/white_box/ (*_engine.py)")
    print("[Engine Info] Methodology : 100% Statement Coverage + 100% Branch Coverage\n")
    
    cmd = [
        sys.executable, "-m", "pytest",
        "test/white_box",
        "-v",
        "--cov=data_scraping",
        "--cov=test/white_box",
        "--cov-branch",
        "--cov-report=term-missing",
        "--cov-fail-under=100"
    ]
    
    omit_flags = [
        "--cov-config=test/white_box/pytest.ini"
    ]
    
    start_time = time.time()
    print("[LAUNCH] Dang khoi chay he thong ban tai kiem thu va quet do phu 100%...\n")
    
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    
    result = subprocess.run(cmd + omit_flags, cwd=project_root, env=env)
    elapsed = time.time() - start_time
    
    print("\n" + "=" * 80)
    if result.returncode == 0:
        print(" [SUCCESS] CHUC MUNG! HE THONG DA VUOT QUA QUALITY GATE AN TOAN 100% COVERAGE!")
        print(f" [TIME] Thoi gian tong hop va thuc thi toan bo luong: {elapsed:.2f} giay.")
        print(" [CHECK] Khong co bat ky dong lenh hay nhanh re nao bi ho lo ro hay bo sot.")
    else:
        print(" [FAILED] CANH BAO: QUALITY GATE THAT BAI! DO PHU CHUA DAT TUYET DOI 100%!")
        print(" [ACTION] Hay kiem tra bang Terminal phia tren tai cot 'Missing' va 'Branch' de bo sung test.")
        sys.exit(1)
    print("=" * 80)

if __name__ == "__main__":  # pragma: no cover
    main()
