import { expect, test } from '@playwright/test';

test('highlights Watchlist navigation on the home page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Watchlist' })).toHaveClass(/active/);
  await expect(page.getByRole('link', { name: 'All Coins' })).not.toHaveClass(/active/);
});

test('highlights All Coins navigation and hides Add Coin on browse page', async ({ page }) => {
  await page.goto('/coins/browse');

  await expect(page.getByRole('link', { name: 'All Coins' })).toHaveClass(/active/);
  await expect(page.getByRole('link', { name: 'Watchlist' })).not.toHaveClass(/active/);
  await expect(page.getByRole('button', { name: 'Add Coin' })).toHaveCount(0);
});