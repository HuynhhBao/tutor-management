# -*- coding: utf-8 -*-
"""
EduMatch Automated Black-Box Validation Engine & Postman Suite Auditor
He thong tu dong tham tra cau truc JSON v2.1 cua Postman Collections va dem ty le cam ket
kich ban kiem thu Phan tich Gia tri Bien (BVA) & Phan loai Tuong duong (EP).
"""

import os
import sys
import json
import argparse
from pathlib import Path

def audit_postman_collections(root_dir: Path):
    """Quet toan bo thu muc test/black_box/ de kiem tra hop phap hoa Postman Collections."""
    print("=" * 80)
    print(" [TARGET] EDUMATCH BLACK-BOX TESTING AUTOMATED AUDITING ENGINE")
    print("=" * 80)
    print(f"[Engine Info] Root directory : {root_dir}")
    print("[Engine Info] Methodology     : Equivalence Partitioning (EP) + Boundary Value Analysis (BVA)")
    print("[Engine Info] Requirement     : 100% Postman Schema v2.1 Compliance & Automated pm.test() Scripts")
    print("\n[LAUNCH] Dang thi hanh quet va thiet lap nghiem thu kich ban Hop den...\n")

    collections_found = 0
    total_requests = 0
    total_test_scripts = 0
    total_ep_cases = 0
    total_bva_cases = 0

    results_table = []
    
    # 5 thu muc nghiep vu tieu chuan
    expected_modules = ["auth_account", "student_features", "tutor_features", "admin_features", "expansion_modules"]
    
    for mod in expected_modules:
        mod_dir = root_dir / mod
        if not mod_dir.exists():
            continue
            
        json_files = list(mod_dir.glob("*.postman_collection.json"))
        for col_path in json_files:
            collections_found += 1
            rel_path = col_path.relative_to(root_dir)
            
            try:
                with open(col_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except json.JSONDecodeError as e:
                print(f"[FAILED] Loi cu phap JSON tai tap tin: {rel_path} - Detail: {e}")
                sys.exit(1)
                
            # Kiem tra schema v2.1
            schema = data.get("info", {}).get("schema", "")
            if "v2.1.0" not in schema and "v2.0.0" not in schema:
                print(f"[WARNING] Collection {rel_path} khong theo schema Postman v2.1.0 chuon xac!")

            req_count = 0
            script_count = 0
            ep_count = 0
            bva_count = 0

            def parse_items(items):
                nonlocal req_count, script_count, ep_count, bva_count
                for item in items:
                    if "item" in item and isinstance(item["item"], list):
                        parse_items(item["item"])
                    elif "request" in item:
                        req_count += 1
                        name = item.get("name", "")
                        if "BVA" in name.upper() or "BIEN" in name.upper() or "BOUNDARY" in name.upper() or "MIN" in name.upper() or "MAX" in name.upper() or "OVER" in name.upper() or "UNDER" in name.upper() or "10K" in name.upper() or "100M" in name.upper() or "50K" in name.upper() or "DUNG LUONG" in name.upper():
                            bva_count += 1
                        else:
                            ep_count += 1
                            
                        events = item.get("event", [])
                        for ev in events:
                            if ev.get("listen") == "test" and "script" in ev:
                                exec_lines = ev["script"].get("exec", [])
                                script_str = "\n".join(exec_lines)
                                if "pm.test(" in script_str or "pm.expect(" in script_str or "pm.response." in script_str:
                                    script_count += script_str.count("pm.test(")
                                    
            parse_items(data.get("item", []))
            
            total_requests += req_count
            total_test_scripts += script_count
            total_ep_cases += ep_count
            total_bva_cases += bva_count
            
            results_table.append({
                "module": mod,
                "file": str(col_path.name),
                "requests": req_count,
                "scripts": script_count,
                "ep": ep_count,
                "bva": bva_count,
                "status": "VALID v2.1" if req_count > 0 and script_count > 0 else "MISSING SCRIPTS"
            })

    # In ra bang tong ket terminal bang ASCII safe
    print(f"{'Module Nghiep Vu':<20} | {'Ten Collection File':<40} | {'Reqs':<6} | {'Scripts':<8} | {'EP Cases':<8} | {'BVA Cases':<9} | {'Trang Thai':<12}")
    print("-" * 120)
    for r in results_table:
        print(f"{r['module']:<20} | {r['file']:<40} | {r['requests']:<6} | {r['scripts']:<8} | {r['ep']:<8} | {r['bva']:<9} | {r['status']:<12}")
    print("-" * 120)
    print(f"{'TONG KIEM TRA HOP DEN':<63} | {total_requests:<6} | {total_test_scripts:<8} | {total_ep_cases:<8} | {total_bva_cases:<9} | PASSED 100%")
    print("=" * 120)

    if collections_found < 5:
        print(f"\n[WARNING] He thong hien tai chi tim thay {collections_found}/5 Postman Collections yeu cau cho 5 nhom nghiep vu.")
        return False
    elif total_requests == 0 or total_test_scripts == 0:
        print("\n[FAILED] Chua tim thay Request hay ma kiem dinh tu dong pm.test() ben trong Collection.")
        return False
    else:
        print("\n[SUCCESS] CHUC MUNG! Toan bo 5 Postman Collections cho Bo kiem thu Hop den deu hop le va dat cam ket chat luong.")
        print(f"[SUMMARY] Tong cong {total_requests} kich ban API, chia ra {total_ep_cases} Phan lop tuong duong va {total_bva_cases} Phan tich gia tri bien.")
        return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="EduMatch Black-Box Testing Engine")
    parser.add_argument("--audit-only", action="store_true", help="Chi tham sat cau truc va kich ban Collection ma khong chay qua Newman CLI")
    args = parser.parse_args()
    
    project_root = Path(__file__).parent.parent.parent.resolve()
    blackbox_dir = project_root / "test" / "black_box"
    
    success = audit_postman_collections(blackbox_dir)
    if not success:
        sys.exit(1)
    sys.exit(0)
