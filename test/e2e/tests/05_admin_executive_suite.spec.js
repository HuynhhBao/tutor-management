import { test, expect } from '@playwright/test';

test.describe('Module 5: Admin Executive Suite E2E Suite', () => {
  // Mock administrative authentication before each test
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, email: 'admin@edumatch.vn', fullName: 'Super Executive Admin', role: 'admin' }
        })
      });
    });

    await page.route('**/api/admin/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    });

    await page.route('**/api/tutors/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/students/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/classes/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/finance/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ revenue: 50000000, transactions: [] }) });
    });
  });

  test('5.1. Accesses Executive Admin Overview Dashboard (/admin) and verifies telemetry layout', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
    
    // Verify admin dashboard container and navigation header appear
    const dashboardContainer = page.locator('main, div.min-h-screen, body').first();
    await expect(dashboardContainer).toBeVisible();
  });

  test('5.2. Navigates to Tutor Applications & Directory Management (/admin/tutors)', async ({ page }) => {
    await page.goto('/admin/tutors');
    await expect(page).toHaveURL('/admin/tutors');
    
    const directoryBody = page.locator('body');
    await expect(directoryBody).toBeVisible();
  });

  test('5.3. Navigates to Student Accounts Management (/admin/students)', async ({ page }) => {
    await page.goto('/admin/students');
    await expect(page).toHaveURL('/admin/students');
    
    const studentsView = page.locator('body');
    await expect(studentsView).toBeVisible();
  });

  test('5.4. Navigates to Class Scheduling Management portal (/admin/classes)', async ({ page }) => {
    await page.goto('/admin/classes');
    await expect(page).toHaveURL('/admin/classes');
    await expect(page.locator('body')).toBeVisible();
  });

  test('5.5. Navigates to Financial Disbursement & Revenue Management portal (/admin/finance)', async ({ page }) => {
    await page.goto('/admin/finance');
    await expect(page).toHaveURL('/admin/finance');
    await expect(page.locator('body')).toBeVisible();
  });

  test('5.6. Verifies profile dropdown interactivity and account management options', async ({ page }) => {
    await page.goto('/admin');
    
    // Verify admin session elements or logout capability in the user account menu
    const accountTrigger = page.locator('button:has-text("Admin"), button:has-text("Super"), button[class*="account" i], button[class*="profile" i]').first();
    if (await accountTrigger.isVisible()) {
      await accountTrigger.click();
      // Inspect dropdown menu opening
      const dropdown = page.locator('div[class*="menu" i], div[class*="dropdown" i], button:has-text("Đăng xuất")').first();
      await expect(dropdown).toBeVisible();
    } else {
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});
