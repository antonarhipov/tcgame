import { test, expect } from '@playwright/test';

// Validates that the strong route 1A → 2A → 3A → 4A → 5B achieves a high score
// This guards against UI/config drift where the app might use outdated meter parameters.

test.describe('Strong route produces high score', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('1A → 2A → 3A → 4A → 5B yields >= 60 with current tuning', async ({ page }) => {
    // Start
    await expect(page.getByText('Start New Journey')).toBeVisible();
    await page.getByText('Start New Journey').click();

    // Step 1: A
    await expect(page.getByText('Step 1')).toBeVisible();
    await page.getByText('Option A').click();
    await expect(page.getByText('Choice Implemented!')).toBeVisible();
    await page.getByText('Continue').click();

    // Step 2: A
    await expect(page.getByText('Step 2')).toBeVisible();
    await page.getByText('Option A').click();
    await expect(page.getByText('Choice Implemented!')).toBeVisible();
    await page.getByText('Continue').click();

    // Step 3: A
    await expect(page.getByText('Step 3')).toBeVisible();
    await page.getByText('Option A').click();
    await expect(page.getByText('Choice Implemented!')).toBeVisible();
    await page.getByText('Continue').click();

    // Step 4: A
    await expect(page.getByText('Step 4')).toBeVisible();
    await page.getByText('Option A').click();
    await expect(page.getByText('Choice Implemented!')).toBeVisible();
    await page.getByText('Continue').click();

    // Step 5: B
    await expect(page.getByText('Step 5')).toBeVisible();
    await page.getByText('Option B').click();

    // Finale
    // Some builds auto-navigate; others show a button. Click if needed.
    const continueButton = page.getByText('Continue');
    const finaleButton = page.getByText('View Results');
    if (await continueButton.isVisible()) {
      await continueButton.click();
    } else if (await finaleButton.isVisible()) {
      await finaleButton.click();
    }

    // We expect a high final meter (≥ 60) for this route with tuned defaults.
    await expect(page.getByText('Final Scaling Meter')).toBeVisible();

    // Read the numeric meter value from the ScalingMeter component: e.g., "72/100"
    const meterText = await page.getByText(/\b\d{1,3}\/100\b/).innerText();
    const match = meterText.match(/(\d{1,3})\/100/);
    expect(match).not.toBeNull();
    const finalMeter = Number(match![1]);

    expect(finalMeter).toBeGreaterThanOrEqual(60);
    // Also check tier is at least Gaining Steam (50–69) or better
    const tierText = await page.getByText(/Current Tier:/).innerText();
    expect(tierText).toMatch(/Gaining Steam|Scaling Up|Breakout Trajectory/);
  });
});
