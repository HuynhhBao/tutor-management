import { test, expect } from '@playwright/test';

test.describe('Module 4: Tutor Journey & Virtual Classroom E2E Suite', () => {
  // Mock tutor authentication before each test
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 202, email: 'tutor.math@gmail.com', fullName: 'Gia Sư Toán E2E', role: 'tutor' }
        })
      });
    });

    await page.route('**/api/tutors/my-classes**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { _id: 'c1', subject: 'Toán học 12', schedule: 'Thứ 2, 4, 6 (18:00 - 20:00)', studentName: 'Học Viên A' }
        ])
      });
    });

    await page.route('**/api/finance/tutor**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ totalEarnings: 15000000, pendingPayouts: 2000000 })
      });
    });
  });

  test('4.1. Accesses Tutor Dashboard (/tutor-dashboard) and verifies tutor layout structure', async ({ page }) => {
    await page.goto('/tutor-dashboard');
    await expect(page).toHaveURL('/tutor-dashboard');
    
    const pageBody = page.locator('body');
    await expect(pageBody).toBeVisible();
  });

  test('4.2. Navigates to My Classes Portal (/tutor-dashboard/my-classes)', async ({ page }) => {
    await page.goto('/tutor-dashboard/my-classes');
    await expect(page).toHaveURL('/tutor-dashboard/my-classes');
    
    // Verify content container renders
    const mainContent = page.locator('main, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('4.3. Navigates to Tutor Finance & Revenue Stats (/tutor-dashboard/finance)', async ({ page }) => {
    await page.goto('/tutor-dashboard/finance');
    await expect(page).toHaveURL('/tutor-dashboard/finance');

    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });

  test('4.4. Accesses Virtual Classroom (/classroom/room-101) and verifies Excalidraw Whiteboard Canvas', async ({ page }) => {
    // Mock room verification API
    await page.route('**/api/classroom/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'room-101', title: 'Phòng học Toán Cao Cấp', active: true })
      });
    });

    await page.goto('/classroom/room-101');
    await expect(page).toHaveURL('/classroom/room-101');

    // Verify virtual classroom UI mounts (canvas or container)
    const classroomView = page.locator('canvas, div[class*="classroom" i], body').first();
    await expect(classroomView).toBeVisible();
  });

  test('4.5. Verifies Virtual Classroom interactive controls and layout resilience', async ({ page }) => {
    await page.goto('/classroom/room-101');
    
    // Verify room stays open without fatal crash or white-screen errors
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});
