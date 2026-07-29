import os, subprocess, sys, time, urllib.request, urllib.error, io

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

"""
==============================================================================
 EDUMATCH CODE COVERAGE AUDIT ENGINE (WHITE-BOX PILLAR 1 + INTEGRATION PILLAR 3)
==============================================================================
Cong cu do luong do phu ma nguon thuc te (Code Coverage) cho Backend.
Trinh tu: 
  1. Khoi dong Backend doc lap tren PORT 3009 duoi su giam sat cua c8 (V8 coverage)
  2. Chay toan bo 5 bo Newman Integration Suite vao Backend tren port 3009
  3. Goi endpoint tat mau /api/test/shutdown de c8 xuat bao cao Coverage (Text + HTML)
=============================================================================="""

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(ROOT, '..', '..'))
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
ENV_FILE = os.path.join(ROOT, 'EduMatch_Local.postman_environment.json')
COVERAGE_DIR = os.path.join(ROOT, 'coverage_report')
TEST_PORT = "3009"
TEST_BASE_URL = f"http://localhost:{TEST_PORT}/api"

COLLECTIONS = [
    os.path.join(ROOT, 'auth_account', 'Auth_Integration.postman_collection.json'),
    os.path.join(ROOT, 'student_features', 'Student_Integration.postman_collection.json'),
    os.path.join(ROOT, 'tutor_features', 'Tutor_Integration.postman_collection.json'),
    os.path.join(ROOT, 'admin_features', 'Admin_Integration.postman_collection.json'),
    os.path.join(ROOT, 'expansion_modules', 'Expansion_Integration.postman_collection.json'),
]

SEP = '=' * 90

def print_banner():
    print(SEP)
    print(' EDUMATCH CODE COVERAGE AUDIT ENGINE')
    print(' White-Box (Pillar 1) + Backend Integration (Pillar 3) Synergy')
    print(SEP)
    print(f'[Info] Project Root   : {PROJECT_ROOT}')
    print(f'[Info] Backend Dir    : {BACKEND_DIR}')
    print(f'[Info] Coverage Dir   : {COVERAGE_DIR}')
    print(f'[Info] Test Server    : {TEST_BASE_URL}')
    print(f'[Info] Collections    : {len(COLLECTIONS)} modules')
    print()

def check_c8():
    """Kiem tra c8 co san khong"""
    try:
        cmd = 'npx -y c8 --version'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30, cwd=BACKEND_DIR)
        version = result.stdout.strip() or result.stderr.strip()
        print(f'[OK] c8 verification (V8 Engine): {version}')
        return True
    except Exception as e:
        print(f'[ERROR] Khong the kiem tra c8: {e}')
        return False

def start_backend_with_coverage():
    """Khoi dong Backend tren port 3009 voi c8 coverage"""
    print(f'[STEP 1] Dang khoi dong Backend tren PORT {TEST_PORT} voi c8 Code Coverage monitor...')
    
    tmp_dir = os.path.join(COVERAGE_DIR, '.tmp')
    cmd = f'npx -y c8 --include="controllers/**" --include="services/**" --include="middlewares/**" --include="routes/**" --include="utils/**" --reporter=text --reporter=html --report-dir="{COVERAGE_DIR}" --temp-directory="{tmp_dir}" node index.js'
    
    env = os.environ.copy()
    env['NODE_ENV'] = 'test'
    env['PORT'] = TEST_PORT
    
    proc = subprocess.Popen(
        cmd,
        cwd=BACKEND_DIR,
        env=env,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    print(f'[STEP 1] Dang cho Backend (port {TEST_PORT}) khoi dong (5 giay)...')
    time.sleep(5)
    
    if proc.poll() is not None:
        stdout, stderr = proc.communicate()
        print(f'[ERROR] Backend da dung ngay. stdout: {stdout.decode(errors="replace")[:500]}')
        print(f'[ERROR] stderr: {stderr.decode(errors="replace")[:500]}')
        return None
    
    print(f'[STEP 1] Backend tren PORT {TEST_PORT} da san sang voi c8 V8 tracking!')
    return proc

def run_newman_suites():
    """Chay toan bo 5 bo Newman collection vao Backend tren port 3009"""
    print()
    print(f'[STEP 2] Dang xui Newman xa toan bo 5 bo test vao Backend ({TEST_BASE_URL})...')
    print('-' * 90)
    
    results = []
    for i, col_path in enumerate(COLLECTIONS, 1):
        col_name = os.path.basename(col_path)
        module_name = os.path.basename(os.path.dirname(col_path))
        print(f'  [{i}/5] Dang chay: {module_name} / {col_name}')
        
        cmd = f'npx -y newman run "{col_path}" -e "{ENV_FILE}" --env-var "base_url={TEST_BASE_URL}" --silent'
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120, cwd=PROJECT_ROOT)
            success = result.returncode == 0
            status_str = 'PASSED' if success else 'FAILED (Co loi hoac assertion tai module nay)'
            print(f'         => {status_str}')
            if not success:
                print(f'         [Log tóm tắt chi tiết lỗi]\n{result.stdout[-1500:]}\n{result.stderr[-500:]}')
            results.append({'module': module_name, 'file': col_name, 'success': success})
        except subprocess.TimeoutExpired:
            print(f'         => TIMEOUT')
            results.append({'module': module_name, 'file': col_name, 'success': False})
        except Exception as e:
            print(f'         => ERROR: {e}')
            results.append({'module': module_name, 'file': col_name, 'success': False})
    
    print('-' * 90)
    passed = sum(1 for r in results if r['success'])
    print(f'  Tong ket Newman: {passed}/{len(results)} modules PASSED')
    return results

def stop_backend_and_harvest(proc):
    """Dung Backend qua endpoint /api/test/shutdown de c8 xuat bao cao"""
    print()
    print('[STEP 3] Dang goi endpoint /api/test/shutdown de tat Backend & thu hoach bao cao c8...')
    
    if proc is None:
        print('[SKIP] Khong co tien trinh Backend nao dang chay.')
        return
    
    try:
        req = urllib.request.Request(f'{TEST_BASE_URL}/test/shutdown', method='POST')
        try:
            with urllib.request.urlopen(req, timeout=3) as resp:
                print(f'  Phan hoi tu server: {resp.read().decode("utf-8")}')
        except Exception as e:
            print(f'  [Info] Goi shutdown hoan tat hoac ket noi dong nhanh: {e}')
        
        print('  Dang doi c8 tong hop va xuat bao cao V8 Coverage (6 giay)...')
        try:
            stdout, stderr = proc.communicate(timeout=15)
            output = stdout.decode('utf-8', errors='replace') if stdout else ''
            
            if output:
                print('\n' + SEP)
                print(' KET QUA DO LUONG CODE COVERAGE THUC TE (V8 / ISTANBUL REPORT)')
                print(SEP)
                lines = output.split('\n')
                for line in lines:
                    if any(k in line for k in ['-----', 'File', '% Stmts', '% Branch', '% Funcs', '% Lines', 'Uncovered Line', 'All files', 'controllers', 'services', 'middlewares', 'routes', 'utils', '.js']):
                        print(f'  {line}')
                        
        except subprocess.TimeoutExpired:
            proc.kill()
            print('[WARNING] Tien trinh bi cuong tat do c8 xuat file qua lau.')
    except Exception as e:
        print(f'[ERROR] Loi khi dung Backend: {e}')
        try:
            proc.kill()
        except:
            pass

def main():
    print_banner()
    if not check_c8():
        print('[ERROR] Khong the tim thay c8. Kiem tra ket noi npm/npx.')
        return
    
    proc = start_backend_with_coverage()
    if proc is None:
        print('[ERROR] Khong khoi dong duoc server test.')
        return
    
    results = run_newman_suites()
    stop_backend_and_harvest(proc)
    
    print()
    print(SEP)
    all_pass = all(r['success'] for r in results)
    if all_pass:
        print('[SUCCESS] TOAN BO QUY TRINH AUDIT CODE COVERAGE HOAN TAT THANH CONG 100%!')
        print(f'[INFO] Bao cao HTML chi tiet duoc luu tai: {COVERAGE_DIR}/index.html')
    else:
        print('[NOTICE] Quasar trinh audit hoan tat co module Newman bao loi (co the do Negative test assertion).')
        print(f'[INFO] Bao cao HTML Coverage van duoc luu tai: {COVERAGE_DIR}/index.html')
    print(SEP)

if __name__ == '__main__':
    main()
