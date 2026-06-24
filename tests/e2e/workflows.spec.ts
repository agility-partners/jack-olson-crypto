import { test, expect } from '@playwright/test';

test.describe('Coin detail page', () => {
  test('displays full coin info and returns to watchlist via back button', async ({ page }) => {
    await page.goto('/coins/bitcoin');

    // Header info
    const heading = page.locator('h1', { hasText: 'Bitcoin' });
    await expect(heading).toBeVisible({ timeout: 10000 });

    await expect(page.getByText(/Rank #1/)).toBeVisible();

    // Price section with USD label
    await expect(page.getByText('USD')).toBeVisible();

    // Stats grid should show Market Cap and 24h Volume cards
    await expect(page.getByText('Market Cap')).toBeVisible();
    await expect(page.getByText('24h Volume')).toBeVisible();

    // All-Time High stat card
    await expect(page.getByText('All-Time High')).toBeVisible();

    // About section
    await expect(page.getByText(/About Bitcoin/i)).toBeVisible();

    // Back button navigates to home
    const backButton = page.getByRole('link', { name: /Back to Watchlist/i });
    await expect(backButton).toBeVisible();
    await backButton.click();

    await page.waitForURL('/', { timeout: 10000 });
    await expect(page.locator('h1', { hasText: 'My Watchlist' })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Browse page filters and view modes', () => {
  test('applies Losers filter and toggles between grid and list view', async ({ page }) => {
    await page.goto('/coins/browse');

    const cards = page.locator('a[href*="/coins/"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    // Apply Losers filter
    const losersButton = page.getByRole('button', { name: 'Losers' });
    await expect(losersButton).toBeVisible();
    await losersButton.click();
    await expect(losersButton).toHaveClass(/active/, { timeout: 5000 });

    // At least one coin should be visible after filtering
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    // Switch to list view
    const listViewButton = page.getByRole('button', { name: 'List view' });
    await expect(listViewButton).toBeVisible();
    await listViewButton.click();
    await expect(listViewButton).toHaveClass(/active/, { timeout: 5000 });

    // Cards still visible in list view
    await expect(cards.first()).toBeVisible({ timeout: 5000 });

    // Switch back to grid view
    const gridViewButton = page.getByRole('button', { name: 'Grid view' });
    await gridViewButton.click();
    await expect(gridViewButton).toHaveClass(/active/, { timeout: 5000 });
  });
});
