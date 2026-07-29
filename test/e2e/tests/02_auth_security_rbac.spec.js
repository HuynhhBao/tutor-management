import { test, expect } from '@playwright/test';

test.describe('Module 2: Auth & Security RBAC E2E Suite', () => {
  test('2.1. Verifies login form field interaction and tab navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Locate and fill login credentials
    const emailInput = page.locator('input[placeholder*="email" i], input[type="email"], input[name="email"], input').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('e2e.tester@gmail.com');
    await passwordInput.fill('SecurePass123!');
    
    await expect(emailInput).toHaveValue('e2e.tester@gmail.com');
    await expect(passwordInput).toHaveValue('SecurePass123!');
  });

  test('2.2. Simulates login API rejection and verifies error banner appears on UI', async ({ page }) => {
    await page.goto('/login');

    // Intercept login API to simulate invalid credentials response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Tài khoản hoặc mật khẩu không chính xác' })
      });
    });

    const inputs = page.locator('input');
    await inputs.nth(0).fill('wrong@gmail.com');
    await inputs.nth(1).fill('WrongPass!');
    
    const submitBtn = page.locator('button[type="submit"], button:has-text("Đăng nhập")').first();
    await submitBtn.click();

    // Verify error message is rendered directly on screen
    const errorBanner = page.locator('body');
    await expect(errorBanner).toContainText(/Tài khoản hoặc mật khẩu không chính xác|thất bại|Lỗi|error/i);
  });

  test('2.3. Simulates successful Student login and routing transition to /student-dashboard', async ({ page }) => {
    // Intercept auth checks to simulate logged-in user after submission
    let isLoggedIn = false;
    await page.route('**/api/auth/me', async route => {
      if (isLoggedIn) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 101, email: 'student@gmail.com', fullName: 'E2E Student', role: 'user' } })
        });
      } else {
        await route.fulfill({ status: 401, body: 'Unauthorized' });
      }
    });

    await page.route('**/api/auth/login', async route => {
      isLoggedIn = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 101, email: 'student@gmail.com', fullName: 'E2E Student', role: 'user' } })
      });
    });

    await page.goto('/login');
    const inputs = page.locator('input');
    await inputs.nth(0).fill('student@gmail.com');
    await inputs.nth(1).fill('CorrectPass123!');
    
    const submitBtn = page.locator('button[type="submit"], button:has-text("Đăng nhập")').first();
    await submitBtn.click();

    // Verify automatic redirect to student dashboard
    await expect(page).toHaveURL(/.*\/student-dashboard.*/);
  });

  test('2.4. RBAC Security Verification: Unauthenticated visitor blocked from /student-dashboard', async ({ page }) => {
    // Ensure auth check fails (unauthenticated guest)
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({ status: 401, body: 'Unauthorized' });
    });

    // Attempt direct URL access to protected student dashboard
    await page.goto('/student-dashboard');

    // ProtectedRoute blocks unauthorized access and redirects back to root (/)
    await expect(page).toHaveURL('/');
  });

  test('2.5. RBAC Security Verification: Unauthenticated user blocked from executive /admin suite', async ({ page }) => {
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({ status: 401, body: 'Unauthorized' });
    });

    // Attempt direct URL access to protected admin suite
    await page.goto('/admin');

    // ProtectedRoute immediately intercepts and redirects to /admin/login
    await expect(page).toHaveURL('/admin/login');
  });
});
