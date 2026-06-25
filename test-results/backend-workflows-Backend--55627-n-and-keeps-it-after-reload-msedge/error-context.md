# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: backend-workflows.spec.ts >> Backend watchlist journeys >> starts empty, lets the user add a coin, and keeps it after reload
- Location: tests\e2e\backend-workflows.spec.ts:33:7

# Error details

```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

# Test source

```ts
  1   | import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
  2   | 
  3   | const apiBaseUrl = 'http://127.0.0.1:8080/api';
  4   | 
  5   | async function resetWatchlist(request: APIRequestContext) {
  6   |   const response = await request.get(`${apiBaseUrl}/watchlist`);
  7   |   expect(response.ok()).toBeTruthy();
  8   | 
> 9   |   const watchlist = await response.json();
      |                     ^ SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
  10  | 
  11  |   for (const coin of watchlist) {
  12  |     const removeResponse = await request.delete(`${apiBaseUrl}/watchlist/${coin.id}`);
  13  |     expect(removeResponse.ok()).toBeTruthy();
  14  |   }
  15  | }
  16  | 
  17  | async function seedWatchlist(request: APIRequestContext, coinIds: string[]) {
  18  |   for (const coinId of coinIds) {
  19  |     const response = await request.post(`${apiBaseUrl}/watchlist`, {
  20  |       data: { coinId },
  21  |     });
  22  | 
  23  |     expect(response.status()).toBe(201);
  24  |   }
  25  | }
  26  | 
  27  | async function openAddCoinModal(page: Page) {
  28  |   await page.getByRole('button', { name: /add coin/i }).click();
  29  |   await expect(page.getByRole('heading', { name: 'Add Cryptocurrency' })).toBeVisible();
  30  | }
  31  | 
  32  | test.describe('Backend watchlist journeys', () => {
  33  |   test('starts empty, lets the user add a coin, and keeps it after reload', async ({ page, request }) => {
  34  |     await resetWatchlist(request);
  35  | 
  36  |     await page.goto('/');
  37  | 
  38  |     await expect(page.getByText('Tracking 0 assets')).toBeVisible();
  39  |     await expect(page.getByText('No coins found')).toBeVisible();
  40  |     await expect(page.getByText('0 / 0')).toBeVisible();
  41  | 
  42  |     await openAddCoinModal(page);
  43  |     await page.getByLabel('Select Cryptocurrency').selectOption('bitcoin');
  44  |     await page.getByRole('button', { name: 'Add to Watchlist' }).click();
  45  | 
  46  |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible({ timeout: 10000 });
  47  |     await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  48  |     await expect(page.getByText('1 / 1')).toBeVisible();
  49  | 
  50  |     await page.reload();
  51  | 
  52  |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible({ timeout: 10000 });
  53  |     await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  54  |   });
  55  | 
  56  |   test('removes a persisted coin and keeps the trimmed watchlist after reload', async ({ page, request }) => {
  57  |     await resetWatchlist(request);
  58  |     await seedWatchlist(request, ['bitcoin', 'ethereum']);
  59  | 
  60  |     await page.goto('/');
  61  | 
  62  |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible({ timeout: 10000 });
  63  |     await expect(page.locator('main a[href="/coins/ethereum"]')).toBeVisible({ timeout: 10000 });
  64  |     await expect(page.getByText('Tracking 2 assets')).toBeVisible();
  65  |     await expect(page.getByText('1 / 2')).toBeVisible();
  66  | 
  67  |     await page.getByRole('button', { name: 'Remove Ethereum from watchlist' }).click();
  68  | 
  69  |     await expect(page.locator('main a[href="/coins/ethereum"]')).toHaveCount(0);
  70  |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible();
  71  |     await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  72  |     await expect(page.getByText('1 / 1')).toBeVisible();
  73  | 
  74  |     await page.reload();
  75  | 
  76  |     await expect(page.locator('main a[href="/coins/ethereum"]')).toHaveCount(0);
  77  |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toBeVisible({ timeout: 10000 });
  78  |     await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  79  |   });
  80  | 
  81  |   test('accepts a stale add flow when the backend already added the selected coin', async ({ page, request }) => {
  82  |     await resetWatchlist(request);
  83  | 
  84  |     await page.goto('/');
  85  |     await openAddCoinModal(page);
  86  |     await page.getByLabel('Select Cryptocurrency').selectOption('bitcoin');
  87  | 
  88  |     const externalAddResponse = await request.post(`${apiBaseUrl}/watchlist`, {
  89  |       data: { coinId: 'bitcoin' },
  90  |     });
  91  |     expect(externalAddResponse.status()).toBe(201);
  92  | 
  93  |     await page.getByRole('button', { name: 'Add to Watchlist' }).click();
  94  | 
  95  |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toHaveCount(1, { timeout: 10000 });
  96  |     await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  97  |     await expect(page.getByRole('heading', { name: 'Add Cryptocurrency' })).toHaveCount(0);
  98  | 
  99  |     await page.reload();
  100 | 
  101 |     await expect(page.locator('main a[href="/coins/bitcoin"]')).toHaveCount(1, { timeout: 10000 });
  102 |     await expect(page.getByText('Tracking 1 assets')).toBeVisible();
  103 |   });
  104 | });
  105 | 
```