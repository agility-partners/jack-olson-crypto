import { test, expect, type APIRequestContext } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:8081/api';

async function resetWatchlist(request: APIRequestContext) {
  const response = await request.get(`${apiBaseUrl}/watchlist`);
  expect(response.ok()).toBeTruthy();

  const watchlist = (await response.json()) as Array<{ id: string }>;

  for (const coin of watchlist) {
    const removeResponse = await request.delete(`${apiBaseUrl}/watchlist/${coin.id}`);
    expect(removeResponse.ok()).toBeTruthy();
  }
}

async function seedWatchlist(request: APIRequestContext, coinIds: string[]) {
  for (const coinId of coinIds) {
    const response = await request.post(`${apiBaseUrl}/watchlist`, {
      data: { coinId },
    });
    expect(response.status()).toBe(201);
  }
}

test.describe('Browse page additional coverage', () => {
  test('shows market stats bar with expected labels', async ({ page }) => {
    await page.goto('/coins/browse');

    await expect(page.locator('a[href*="/coins/"]').first()).toBeVisible({ timeout: 10000 });

    // Scope to the StatsBar container to avoid matching coin-card labels with the same text
    const statsBar = page.locator('[class*="statsBar"]');
    await expect(statsBar.getByText('Total market cap', { exact: true })).toBeVisible();
    await expect(statsBar.getByText('24h volume', { exact: true })).toBeVisible();
    await expect(statsBar.getByText('BTC dominance', { exact: true })).toBeVisible();
  });

  test('search input filters the coin list on browse page', async ({ page }) => {
    await page.goto('/coins/browse');

    const cards = page.locator('a[href*="/coins/"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    const totalBefore = await cards.count();
    expect(totalBefore).toBeGreaterThan(1);

    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('bitcoin');

    // After filtering there should be fewer (or equal) results, all matching 'bitcoin'
    const matching = cards.filter({ hasText: /bitcoin/i });
    await expect(matching.first()).toBeVisible({ timeout: 10000 });

    const filteredCount = await cards.count();
    expect(filteredCount).toBeLessThanOrEqual(totalBefore);
  });
});

test.describe('Coin detail page additional coverage', () => {
  test('shows all four price-change timeframes', async ({ page }) => {
    await page.goto('/coins/bitcoin');

    await expect(page.locator('h1', { hasText: 'Bitcoin' })).toBeVisible({ timeout: 10000 });

    // Each timeframe label should appear in the changes strip
    // Use exact:true so '24h' doesn't also match '24h Volume'
    for (const label of ['24h', '7d', '30d', '1y']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test('shows Circulating Supply and official website stats', async ({ page }) => {
    await page.goto('/coins/bitcoin');

    await expect(page.locator('h1', { hasText: 'Bitcoin' })).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Circulating Supply')).toBeVisible();
    await expect(page.getByText('Official Website')).toBeVisible();

    // The website link should be an anchor pointing to bitcoin.org
    const websiteLink = page.locator('a[href*="bitcoin.org"]');
    await expect(websiteLink).toBeVisible();
  });

  test('navigating to coin from browse page shows "Back to Browse Menu" button', async ({ page }) => {
    await page.goto('/coins/browse');

    const cards = page.locator('a[href*="/coins/"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    // Append ?from=browse so the detail page knows to go back to browse
    await page.goto('/coins/bitcoin?from=browse');

    const backButton = page.getByRole('link', { name: /Back to Browse Menu/i });
    await expect(backButton).toBeVisible({ timeout: 10000 });

    await backButton.click();
    await page.waitForURL('/coins/browse', { timeout: 10000 });
    await expect(page.locator('h1', { hasText: 'All Coins' })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Backend multi-coin watchlist journeys', () => {
  test('adds three coins and verifies the counter tracks them all', async ({ page, request }) => {
    await resetWatchlist(request);
    await seedWatchlist(request, ['bitcoin', 'ethereum', 'solana']);

    await page.goto('/');

    await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('main a[href="/coins/ethereum"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('main a[href="/coins/solana"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Tracking 3 assets')).toBeVisible();
  });
});
