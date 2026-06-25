import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:8080/api';

async function resetWatchlist(request: APIRequestContext) {
  const response = await request.get(`${apiBaseUrl}/watchlist`);
  expect(response.ok()).toBeTruthy();

  const watchlist = await response.json();

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

async function openAddCoinModal(page: Page) {
  await page.getByRole('button', { name: /add coin/i }).click();
  await expect(page.getByRole('heading', { name: 'Add Cryptocurrency' })).toBeVisible();
}

test.describe('Backend watchlist journeys', () => {
  test('starts empty, lets the user add a coin, and keeps it after reload', async ({ page, request }) => {
    await resetWatchlist(request);

    await page.goto('/');

    await expect(page.getByText('Tracking 0 assets')).toBeVisible();
    await expect(page.getByText('No coins found')).toBeVisible();
    await expect(page.getByText('0 / 0')).toBeVisible();

    await openAddCoinModal(page);
    await page.getByLabel('Select Cryptocurrency').selectOption('bitcoin');
    await page.getByRole('button', { name: 'Add to Watchlist' }).click();

    await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Tracking 1 assets')).toBeVisible();
    await expect(page.getByText('1 / 1')).toBeVisible();

    await page.reload();

    await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  });

  test('removes a persisted coin and keeps the trimmed watchlist after reload', async ({ page, request }) => {
    await resetWatchlist(request);
    await seedWatchlist(request, ['bitcoin', 'ethereum']);

    await page.goto('/');

    await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('main a[href="/coins/ethereum"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Tracking 2 assets')).toBeVisible();
    await expect(page.getByText('1 / 2')).toBeVisible();

    await page.getByRole('button', { name: 'Remove Ethereum from watchlist' }).click();

    await expect(page.locator('main a[href="/coins/ethereum"]')).toHaveCount(0);
    await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible();
    await expect(page.getByText('Tracking 1 assets')).toBeVisible();
    await expect(page.getByText('1 / 1')).toBeVisible();

    await page.reload();

    await expect(page.locator('main a[href="/coins/ethereum"]')).toHaveCount(0);
    await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  });

  test('accepts a stale add flow when the backend already added the selected coin', async ({ page, request }) => {
    await resetWatchlist(request);

    await page.goto('/');
    await openAddCoinModal(page);
    await page.getByLabel('Select Cryptocurrency').selectOption('bitcoin');

    const externalAddResponse = await request.post(`${apiBaseUrl}/watchlist`, {
      data: { coinId: 'bitcoin' },
    });
    expect(externalAddResponse.status()).toBe(201);

    await page.getByRole('button', { name: 'Add to Watchlist' }).click();

    await expect(page.locator('main a[href="/coins/bitcoin"]')).toHaveCount(1, { timeout: 10000 });
    await expect(page.getByText('Tracking 1 assets')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Cryptocurrency' })).toHaveCount(0);

    await page.reload();

    await expect(page.locator('main a[href="/coins/bitcoin"]')).toHaveCount(1, { timeout: 10000 });
    await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  });
});
