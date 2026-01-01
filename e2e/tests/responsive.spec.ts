import { test, expect } from '@playwright/test';

test.describe('Responsive Tests', () => {
  test('desktop layout (1920x1080) shows full layout', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Logo should be visible
    const logo = page.locator('.logo');
    await expect(logo).toBeVisible();

    // Status strip should be visible
    const statusStrip = page.locator('.status-strip');
    await expect(statusStrip).toBeVisible();

    // Main content should be visible
    const mainContent = page.locator('#mainContent');
    await expect(mainContent).toBeVisible();

    // Check that layout has sufficient width for grid display
    const contentBox = await mainContent.boundingBox();
    if (contentBox) {
      expect(contentBox.width).toBeGreaterThan(768);
    }
  });

  test('tablet layout (768x1024) shows adjusted layout', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Logo should be visible
    const logo = page.locator('.logo');
    await expect(logo).toBeVisible();

    // Status strip should be visible
    const statusStrip = page.locator('.status-strip');
    await expect(statusStrip).toBeVisible();

    // Main content should be visible
    const mainContent = page.locator('#mainContent');
    await expect(mainContent).toBeVisible();

    // Content should adapt to tablet width
    const contentBox = await mainContent.boundingBox();
    if (contentBox) {
      expect(contentBox.width).toBeLessThanOrEqual(768);
      expect(contentBox.width).toBeGreaterThan(0);
    }
  });

  test('mobile layout (375x667) shows single-column touch-friendly layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Logo should be visible on mobile
    const logo = page.locator('.logo');
    await expect(logo).toBeVisible();

    // Status strip should be visible (may be condensed)
    const statusStrip = page.locator('.status-strip');
    await expect(statusStrip).toBeVisible();

    // Main content should be visible
    const mainContent = page.locator('#mainContent');
    await expect(mainContent).toBeVisible();

    // Content should fit within mobile width
    const contentBox = await mainContent.boundingBox();
    if (contentBox) {
      expect(contentBox.width).toBeLessThanOrEqual(375);
      expect(contentBox.width).toBeGreaterThan(0);
    }

    // Check that elements are touch-friendly (if candidates are present)
    const candidates = page.locator('.candidate');
    const candidateCount = await candidates.count();

    if (candidateCount > 0) {
      const firstCandidate = candidates.first();
      const candidateBox = await firstCandidate.boundingBox();

      if (candidateBox) {
        // Touch targets should be at least 44x44px for accessibility
        expect(candidateBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('responsive header adjusts across all viewports', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // Logo should always be visible
      const logo = page.locator('.logo');
      await expect(logo).toBeVisible();

      // Get logo size to verify it adjusts
      const logoBox = await logo.boundingBox();
      expect(logoBox).not.toBeNull();

      if (logoBox) {
        // Logo should fit within viewport width
        expect(logoBox.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });
});
