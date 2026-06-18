import { test, expect } from '@playwright/test';

test.describe('Crypto Watchlist App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
  });

  test('should load the home page', async ({ page }) => {
    // Wait for the page to load and check for a key element
    await page.waitForLoadState('networkidle');
    
    // Check that the page title or heading is visible
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should display cryptocurrency cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for crypto cards (they should have a specific class or data attribute)
    const cards = page.locator('a[href*="/coins/"]');
    const cardCount = await cards.count();
    
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should navigate to coin detail page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click the first cryptocurrency card
    const firstCard = page.locator('a[href*="/coins/"]').first();
    await firstCard.click();
    
    // Wait for navigation and check the URL changed
    await page.waitForURL(/\/coins\//);
    await page.waitForLoadState('networkidle');
    
    // Verify we're on a coin detail page
    const coinName = page.locator('h1').first();
    await expect(coinName).toBeVisible();
  });
});
