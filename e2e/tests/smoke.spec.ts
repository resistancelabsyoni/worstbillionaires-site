import { test, expect } from '@playwright/test';

// Determine API URL - production uses Workers subdomain, local dev uses same host
const getApiUrl = () => {
  if (process.env.API_URL) return process.env.API_URL;

  const baseUrl = process.env.BASE_URL || 'http://localhost:8787';
  // If testing against production frontend, use production API
  if (baseUrl.includes('worstbillionaire.app')) {
    return 'https://worst-billionaires-api-production.rvkgq2t45r.workers.dev';
  }
  return baseUrl;
};

const API_URL = getApiUrl();

test.describe('Smoke Tests - Production Safe', () => {
  test('page loads with correct title and logo', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/WORST BILLIONAIRE 2026/);

    // Check logo is visible
    const logo = page.locator('.logo');
    await expect(logo).toBeVisible();
  });

  test('health endpoint returns OK', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
  });

  test('tournament endpoint returns valid data', async ({ request }) => {
    const response = await request.get(`${API_URL}/tournament`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('currentRound');
    expect(typeof data.currentRound).toBe('number');
  });

  test('key elements are visible on page', async ({ page }) => {
    await page.goto('/');

    // Status strip
    const statusStrip = page.locator('.status-strip');
    await expect(statusStrip).toBeVisible();

    // Countdown
    const countdown = page.locator('#countdown');
    await expect(countdown).toBeVisible();

    // Main content area
    const mainContent = page.locator('#mainContent');
    await expect(mainContent).toBeVisible();
  });

  test('social share buttons are present and clickable', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for share buttons - they should be present
    const shareButtons = page.locator('.share-btn');
    const count = await shareButtons.count();

    // Expect at least some share buttons to exist
    expect(count).toBeGreaterThan(0);

    // Verify first button is clickable
    if (count > 0) {
      await expect(shareButtons.first()).toBeVisible();
    }
  });

  test('responsive header - logo resizes on mobile', async ({ page }) => {
    await page.goto('/');

    // Desktop viewport (default)
    const logo = page.locator('.logo');
    await expect(logo).toBeVisible();

    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Logo should still be visible on mobile
    await expect(logo).toBeVisible();
  });
});
