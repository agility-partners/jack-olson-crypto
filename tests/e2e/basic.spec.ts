import { test, expect } from '@playwright/test';

test.describe('Crypto Watchlist App', () => {
  test('should load the home page', async ({ page }) => {
    // Navigate to home
    await page.goto('/');
    
    // Wait for h1 with "My Watchlist" text
    const heading = page.locator('h1:has-text("My Watchlist")');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display cryptocurrency cards', async ({ page }) => {
    await page.goto('/');
    
    // Wait for cards to appear - they're links with href containing /coins/
    const cards = page.locator('a[href*="/coins/"]');
    
    // Wait for at least one card
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should navigate to coin detail page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for first card and click it
    const firstCard = page.locator('a[href*="/coins/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    
    await firstCard.click();
    
    // Wait for URL to change to /coins/
    await page.waitForURL(/\/coins\/[^/]+$/, { timeout: 10000 });
    
    // Verify we can see coin details
    const coinTitle = page.locator('h1').first();
    await expect(coinTitle).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to browse page', async ({ page }) => {
    await page.goto('/');
    
    // Look for a browse or all coins link
    const browseLink = page.locator('a:has-text("Browse"), a:has-text("All Coins"), a[href*="/browse"]').first();
    
    if (await browseLink.count() > 0) {
      await browseLink.click();
      
      // Should see "All Coins" heading on browse page
      const allCoinsHeading = page.locator('h1:has-text("All Coins")');
      await expect(allCoinsHeading).toBeVisible({ timeout: 10000 });
    }
  });

  test('should filter the watchlist by search term', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('a[href*="/coins/"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByRole('searchbox', { name: /search watchlist/i });
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Use an actual coin from the current randomized watchlist
    const firstCardText = (await cards.first().innerText()).trim();
    const searchTerm = firstCardText.split(/\s+/)[0]; // first word is usually enough and robust

    await searchInput.fill(searchTerm);
    await expect(searchInput).toHaveValue(searchTerm);

    // Verify at least one visible filtered result contains the term
    const matchingCards = cards.filter({ hasText: new RegExp(searchTerm, 'i') });
    await expect(matchingCards.first()).toBeVisible({ timeout: 10000 });

    // Optional: ensure all visible cards match search term (if app truly filters)
    const visibleCount = await cards.count();
    for (let i = 0; i < visibleCount; i++) {
      await expect(cards.nth(i)).toContainText(new RegExp(searchTerm, 'i'));
    }
  });

  test('should apply the Gainers filter and show it as active', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('a[href*="/coins/"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    const gainersButton = page.getByRole('button', { name: 'Gainers' });
    await expect(gainersButton).toBeVisible({ timeout: 10000 });

    await gainersButton.click();

    await expect(gainersButton).toHaveClass(/active/, { timeout: 10000 });
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('should open and close the add coin modal', async ({ page }) => {
    await page.goto('/');

    const addCoinButton = page.getByRole('button', { name: /add coin/i });
    await expect(addCoinButton).toBeVisible({ timeout: 10000 });

    await addCoinButton.click();

    const modalHeading = page.getByRole('heading', { name: 'Add Cryptocurrency' });
    await expect(modalHeading).toBeVisible({ timeout: 10000 });

    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await expect(cancelButton).toBeVisible();

    await cancelButton.click();

    await expect(modalHeading).not.toBeVisible({ timeout: 10000 });
  });
});
