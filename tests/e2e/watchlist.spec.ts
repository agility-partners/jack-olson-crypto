import { test, expect } from '@playwright/test';

test.describe('Watchlist E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the watchlist page before each test
    await page.goto('http://localhost:3000/watchlist');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('User can add a coin to watchlist and see it displayed', async ({ page }) => {
    // Arrange
    const coinName = 'Bitcoin';
    const coinSymbol = 'BTC';

    // Act
    // Find and click the "Add Coin" button
    await page.click('button:has-text("Add Coin")');

    // Wait for the coin selection modal/dropdown to appear
    await page.waitForSelector('[data-testid="coin-select"]');

    // Search for and select Bitcoin
    await page.fill('[data-testid="coin-search"]', 'Bitcoin');
    await page.click(`[data-testid="coin-option-${coinSymbol}"]`);

    // Confirm the addition
    await page.click('button:has-text("Confirm")');

    // Assert
    // Wait for the coin to appear in the watchlist
    await expect(page.locator(`text=${coinName}`)).toBeVisible();
    await expect(page.locator(`text=${coinSymbol}`)).toBeVisible();
  });

  test('User can remove a coin from watchlist', async ({ page }) => {
    // Arrange
    const coinSymbol = 'ETH';

    // Ensure Ethereum is in the watchlist first
    await page.click('button:has-text("Add Coin")');
    await page.waitForSelector('[data-testid="coin-select"]');
    await page.fill('[data-testid="coin-search"]', 'Ethereum');
    await page.click(`[data-testid="coin-option-${coinSymbol}"]`);
    await page.click('button:has-text("Confirm")');

    // Wait for Ethereum to appear
    await expect(page.locator(`text=${coinSymbol}`)).toBeVisible();

    // Act
    // Find the remove button for Ethereum and click it
    const ethereumRow = page.locator(`[data-testid="watchlist-item-${coinSymbol}"]`);
    await ethereumRow.locator('button:has-text("Remove")').click();

    // Confirm removal if there's a confirmation dialog
    const confirmButton = page.locator('button:has-text("Confirm Remove")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Assert
    // Verify that Ethereum is no longer displayed in the watchlist
    await expect(page.locator(`[data-testid="watchlist-item-${coinSymbol}"]`)).not.toBeVisible();
  });
});
