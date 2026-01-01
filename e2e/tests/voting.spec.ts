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

    // Wait for sins content to become visible after expansion animation
    await page.waitForSelector('.sins-content', { state: 'visible', timeout: 5000 });

    // Verify sins content is visible
    const matchupCard = page.locator('.matchup-card').first();
    await expect(matchupCard).toBeVisible();
  });

  test('submit votes shows confirmation message', async ({ page }) => {
    await page.goto('/');

    // Wait for matchup cards to load
    await page.waitForSelector('.matchup-card', { timeout: 5000 });

    // Select candidates in all matchups
    const candidates = page.locator('.candidate');
    expect(await candidates.count()).toBeGreaterThan(0); // Fail if no candidates

    // Click first available candidate
    await candidates.first().click();

    // Find and click submit button
    const submitButton = page.locator('.btn-primary').first();
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Wait for confirmation message
    await page.waitForSelector('.thank-you, .confirmation', { timeout: 5000 });

    // Check for success message
    const thankYou = page.locator('.thank-you');
    await expect(thankYou).toBeVisible();
  });

  test('email registration form accepts valid email', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for email input (may appear after voting or be present initially)
    const emailInput = page.locator('#emailInput');
    await expect(emailInput).toBeVisible();

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
  });

  test('validation shows error for invalid email', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for email input
    const emailInput = page.locator('#emailInput');
    await expect(emailInput).toBeVisible();

    // Enter invalid email
    await emailInput.fill('invalid-email');

    // Try to submit
    const submitButton = page.locator('.btn-primary').first();
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Wait for validation error to appear (error message or invalid state)
    await page.waitForSelector('.error-message, [aria-invalid="true"]', { timeout: 5000 }).catch(() => {
      // If no visual error indicator, HTML5 validation may be handling it
    });

    // Check for validation error (could be native HTML5 validation or custom)
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });
});
