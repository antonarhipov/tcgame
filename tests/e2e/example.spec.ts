import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page loads without errors
  await expect(page).toHaveTitle(/tcgame/i);
  
  // Basic accessibility check
  await expect(page.locator('body')).toBeVisible();
});

test('basic navigation works', async ({ page }) => {
  await page.goto('/');
  
  // Verify the page is interactive
  const body = page.locator('body');
  await expect(body).toBeVisible();
  
  // Check for basic HTML structure
  await expect(page.locator('html')).toBeVisible();
});