import { test, expect } from '@playwright/test';

test.describe('Phase 6: Complete Journey Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('complete journey from start to finale with share', async ({ page }) => {
    // Start the journey
    await page.goto('/');
    
    // Verify we're on the start screen
    await expect(page.getByText('Start New Journey')).toBeVisible();
    
    // Start a new journey
    await page.getByText('Start New Journey').click();
    
    // Complete all 5 steps
    for (let step = 1; step <= 5; step++) {
      // Verify we're on a step screen
      await expect(page.getByText(`Step ${step}`)).toBeVisible();
      
      // Make a choice (always choose option A for consistency)
      await page.getByText('Option A').click();
      
      // Verify we're on feedback screen
      await expect(page.getByText('Choice Implemented!')).toBeVisible();
      await expect(page.getByText(`Step ${step} Complete`)).toBeVisible();
      
      if (step < 5) {
        // Continue to next step
        await page.getByText('Continue').click();
      } else {
        // On step 5, should automatically go to finale or have finale option
        const continueButton = page.getByText('Continue');
        const finaleButton = page.getByText('View Results');
        
        // Click whichever button is available
        if (await continueButton.isVisible()) {
          await continueButton.click();
        } else if (await finaleButton.isVisible()) {
          await finaleButton.click();
        }
      }
    }
    
    // Verify we're on the finale screen
    await expect(page.getByText('Final Scaling Meter')).toBeVisible();
    await expect(page.getByText(/The .* Founder/)).toBeVisible(); // Matches any ending title
    
    // Verify finale content is displayed
    await expect(page.getByText('Your Journey Insights')).toBeVisible();
    await expect(page.getByText('Your Decision Journey')).toBeVisible();
    await expect(page.getByText('Final Message from Junie')).toBeVisible();
    
    // Test the share functionality
    const shareButton = page.getByText('📸 Share Results');
    await expect(shareButton).toBeVisible();
    
    // Set up download handling
    const downloadPromise = page.waitForEvent('download');
    
    // Click share button
    await shareButton.click();
    
    // Verify the button shows generating state
    await expect(page.getByText('Generating...')).toBeVisible();
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/startup-journey-.*\.png/);
    
    // Verify share button returns to normal state
    await expect(shareButton).toBeVisible();
    
    // Test start over functionality
    const startOverButton = page.getByText('🔄 Start New Journey');
    await expect(startOverButton).toBeVisible();
    await startOverButton.click();
    
    // Verify we're back at the start screen
    await expect(page.getByText('Start New Journey')).toBeVisible();
  });

  test('step progression validation prevents skipping', async ({ page }) => {
    await page.goto('/');
    
    // Start a new journey
    await page.getByText('Start New Journey').click();
    
    // Verify we're on step 1
    await expect(page.getByText('Step 1')).toBeVisible();
    
    // Try to manipulate the URL or state to skip to step 3
    // This should be prevented by the GameFlowManager validation
    await page.evaluate(() => {
      const runState = JSON.parse(localStorage.getItem('tcgame_run_state') || '{}');
      runState.currentStep = 3;
      localStorage.setItem('tcgame_run_state', JSON.stringify(runState));
    });
    
    // Reload the page to trigger validation
    await page.reload();
    
    // Should still be on step 1 or the appropriate unlocked step
    await expect(page.getByText('Step 1')).toBeVisible();
  });

  test('finale navigation after step 5 completion', async ({ page }) => {
    await page.goto('/');
    
    // Start and complete journey quickly
    await page.getByText('Start New Journey').click();
    
    // Complete steps 1-4 quickly
    for (let step = 1; step <= 4; step++) {
      await page.getByText('Option A').click();
      await page.getByText('Continue').click();
    }
    
    // Complete step 5
    await page.getByText('Option A').click();
    
    // After step 5, should automatically navigate to finale or show finale option
    // Wait for either automatic navigation or finale button
    await Promise.race([
      expect(page.getByText('Final Scaling Meter')).toBeVisible(),
      expect(page.getByText('View Results')).toBeVisible()
    ]);
    
    // If there's a finale button, click it
    const finaleButton = page.getByText('View Results');
    if (await finaleButton.isVisible()) {
      await finaleButton.click();
    }
    
    // Verify we're on finale
    await expect(page.getByText('Final Scaling Meter')).toBeVisible();
  });

  test('shareable card contains expected content', async ({ page }) => {
    await page.goto('/');
    
    // Complete journey quickly
    await page.getByText('Start New Journey').click();
    
    for (let step = 1; step <= 5; step++) {
      await page.getByText('Option A').click();
      if (step < 5) {
        await page.getByText('Continue').click();
      }
    }
    
    // Navigate to finale if needed
    const finaleButton = page.getByText('View Results');
    if (await finaleButton.isVisible()) {
      await finaleButton.click();
    }
    
    // Verify finale screen elements that should be in the shareable card
    await expect(page.getByText(/The .* Founder/)).toBeVisible();
    await expect(page.getByText(/\/100/)).toBeVisible(); // Score display
    await expect(page.getByText('Revenue')).toBeVisible(); // Dimension labels
    await expect(page.getByText('Users')).toBeVisible();
    await expect(page.getByText('System')).toBeVisible();
    await expect(page.getByText('Customer')).toBeVisible();
    await expect(page.getByText('Investor')).toBeVisible();
    
    // Test share button functionality
    const shareButton = page.getByText('📸 Share Results');
    await expect(shareButton).toBeVisible();
    await expect(shareButton).toBeEnabled();
  });

  test('keyboard navigation works throughout journey', async ({ page }) => {
    await page.goto('/');
    
    // Test keyboard navigation on start screen
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should start the journey
    await expect(page.getByText('Step 1')).toBeVisible();
    
    // Test keyboard navigation in steps
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Select option A
    
    // Should go to feedback
    await expect(page.getByText('Choice Implemented!')).toBeVisible();
    
    // Test keyboard continue
    await page.keyboard.press('Enter');
    
    // Should advance to next step
    await expect(page.getByText('Step 2')).toBeVisible();
  });
});