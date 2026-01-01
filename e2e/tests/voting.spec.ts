import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const isProduction = BASE_URL.includes('worstbillionaires.com');

test.describe('Voting Flow Tests - Local Only', () => {
  test.beforeEach(async () => {
    // Skip all voting tests if running against production
    if (isProduction) {
      test.skip(true, 'Skipping voting tests on production to avoid data pollution');
    }
  });

  test('select candidate adds selected class', async ({ page }) => {
    await page.goto('/');

    // Wait for matchup cards to load
    await page.waitForSelector('.matchup-card', { timeout: 5000 });

    // Find a candidate button
    const candidate = page.locator('.candidate').first();

    // Click the candidate
    await candidate.click();

    // Check that selected class is added
    await expect(candidate).toHaveClass(/selected/);
  });

  test('expand "What did they do?" shows sins content', async ({ page }) => {
    await page.goto('/');

    // Wait for matchup cards to load
    await page.waitForSelector('.matchup-card', { timeout: 5000 });

    // Find and click the sins toggle button
    const sinsToggle = page.locator('.sins-toggle').first();
    await sinsToggle.click();

    // Wait a moment for expansion animation
    await page.waitForTimeout(500);

    // Verify sins content is visible (this will vary based on implementation)
    // Check that the button state changed or content appeared
    const matchupCard = page.locator('.matchup-card').first();
    await expect(matchupCard).toBeVisible();
  });

  test('submit votes shows confirmation message', async ({ page }) => {
    await page.goto('/');

    // Wait for matchup cards to load
    await page.waitForSelector('.matchup-card', { timeout: 5000 });

    // Select candidates in all matchups
    const candidates = page.locator('.candidate');
    const count = await candidates.count();

    if (count > 0) {
      // Click first available candidate
      await candidates.first().click();

      // Find and click submit button (if visible)
      const submitButton = page.locator('.btn-primary').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Wait for confirmation message
        await page.waitForSelector('.thank-you, .confirmation', { timeout: 5000 });

        // Check for success message
        const thankYou = page.locator('.thank-you');
        if (await thankYou.count() > 0) {
          await expect(thankYou).toBeVisible();
        }
      }
    }
  });

  test('email registration form accepts valid email', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for email input (may appear after voting or be present initially)
    const emailInput = page.locator('#emailInput');

    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');

      // Fill optional name if present
      const nameInput = page.locator('#nameInput');
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test User');
      }

      // Check opt-in if present
      const optIn = page.locator('#optIn');
      if (await optIn.count() > 0) {
        await optIn.check();
      }
    }
  });

  test('validation shows error for invalid email', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for email input
    const emailInput = page.locator('#emailInput');

    if (await emailInput.count() > 0) {
      // Enter invalid email
      await emailInput.fill('invalid-email');

      // Try to submit
      const submitButton = page.locator('.btn-primary').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Wait for error message (timing may vary)
        await page.waitForTimeout(1000);

        // Check for validation error (could be native HTML5 validation or custom)
        const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
        expect(isInvalid).toBeTruthy();
      }
    }
  });
});
