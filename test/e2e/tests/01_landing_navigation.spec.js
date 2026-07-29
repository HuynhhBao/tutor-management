import { test, expect } from '@playwright/test';

test.describe('Module 1: Landing Page & Public Navigation E2E Suite', () => {
  test('1.1. Visits landing page (/) and verifies core header/banner elements', async ({ page }) => {
    await page.goto('/');
    // Verify current URL is root
    await expect(page).toHaveURL('/');
    
    // Verify header and hero content render without crashing
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
  });

  test('1.2. Navigates to Student/Tutor Login Page (/login) and verifies login form structure', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');

    // Verify email and password input fields are visible on the page
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="Email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Verify login submission button exists
    const submitBtn = page.locator('button[type="submit"], button:has-text("Đăng nhập")').first();
    await expect(submitBtn).toBeVisible();
  });

  test('1.3. Navigates to Account Registration Page (/register) and verifies signup form', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL('/register');

    // Verify form inputs appear
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThanOrEqual(2);

    // Verify heading "Đăng ký tài khoản" appears
    const heading = page.locator('h2', { hasText: 'Đăng ký tài khoản' });
    await expect(heading).toBeVisible();
  });

  test('1.4. Navigates to Dedicated Admin Portal Login (/admin/login)', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page).toHaveURL('/admin/login');

    // Verify email and password fields exist on admin login page
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
  });

  test('1.5. Verifies Fallback Routing (404 redirect to / when visiting unknown path)', async ({ page }) => {
    // Attempt to access an invalid random route
    await page.goto('/invalid-random-path-987654321');
    
    // App fallback route (*) redirects immediately to /
    await expect(page).toHaveURL('/');
  });
});
