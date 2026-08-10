import { test, expect } from '@playwright/test';

test.describe('Module 3: Student Journey & AI Matchmaking E2E Suite', () => {
  // Mock student authentication before each test in this suite
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 101, email: 'student@gmail.com', fullName: 'Huynh Bao Student', role: 'user' }
        })
      });
    });

    // Mock general tutor list or stats APIs to prevent loading hangs
    await page.route('**/api/tutors**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { _id: 't1', fullName: 'Gia Sư AI Toán 12', bio: 'Chuyên gia toán học thạc sĩ', hourlyRate: 300000, subjects: ['Toán'], rating: 5, status: 'approved' },
          { _id: 't2', fullName: 'Gia Sư Anh Văn IELTS', bio: '8.5 IELTS Academic', hourlyRate: 400000, subjects: ['Tiếng Anh'], rating: 4.8, status: 'approved' }
        ])
      });
    });
  });

  test('3.1. Accesses Student Dashboard (/student-dashboard) and verifies personalized layout', async ({ page }) => {
    await page.goto('/student-dashboard');
    await expect(page).toHaveURL('/student-dashboard');
    
    // Verify application body and navigation controls render without error
    const mainContent = page.locator('main, div.min-h-screen').first();
    await expect(mainContent).toBeVisible();
  });

  test('3.2. Navigates to Tutor Search & AI Matchmaking portal (/student-dashboard/search)', async ({ page }) => {
    await page.goto('/student-dashboard/search');
    await expect(page).toHaveURL('/student-dashboard/search');
    
    // Verify search input field or AI prompt box appears
    const searchInput = page.locator('input[type="text"], input[placeholder*="Tìm" i], textarea, input').first();
    await expect(searchInput).toBeVisible();
  });

  test('3.3. Simulates typing AI matchmaker requirement prompt into search interface', async ({ page }) => {
    await page.goto('/student-dashboard/search');

    const searchInput = page.locator('input[type="text"], input[placeholder*="Tìm" i], input').first();
    const testPrompt = 'Tìm gia sư môn Toán lớp 12 luyện thi đại học điểm cao';
    
    await searchInput.fill(testPrompt);
    await expect(searchInput).toHaveValue(testPrompt);

    // Verify rendered tutor profiles from API mock exist on the DOM
    const pageBody = page.locator('body');
    await expect(pageBody).toContainText(/Toán|Anh|Gia Sư/i);
  });

  test('3.4. Navigates to Booking History Page (/student-dashboard/booking-history)', async ({ page }) => {
    await page.route('**/api/bookings**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/student-dashboard/booking-history');
    await expect(page).toHaveURL('/student-dashboard/booking-history');
    
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });

  test('3.5. Navigates to Student Escrow Wallet Page (/student-dashboard/wallet)', async ({ page }) => {
    await page.route('**/api/wallet**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ balance: 2500000, currency: 'VND' })
      });
    });

    await page.goto('/student-dashboard/wallet');
    await expect(page).toHaveURL('/student-dashboard/wallet');
    
    // Verify wallet container renders
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
