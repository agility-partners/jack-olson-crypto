import { test, expect } from '@playwright/test';

test.describe('Assistant page', () => {
  test('loads with Crypto Assistant heading', async ({ page }) => {
    await page.goto('/assistant');

    const heading = page.locator('h1', { hasText: 'Crypto Assistant' });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('highlights Assistant navigation link as active', async ({ page }) => {
    await page.goto('/assistant');

    await expect(page.getByRole('link', { name: 'Assistant' })).toHaveClass(/active/);
    await expect(page.getByRole('link', { name: 'Watchlist' })).not.toHaveClass(/active/);
    await expect(page.getByRole('link', { name: 'All Coins' })).not.toHaveClass(/active/);
  });

  test('shows suggestion buttons in the empty state', async ({ page }) => {
    await page.goto('/assistant');

    // The empty state renders suggestion buttons before any message is sent
    const suggestions = page.locator('button.suggestionBtn, [class*="suggestionBtn"]');
    await expect(suggestions.first()).toBeVisible({ timeout: 10000 });
    expect(await suggestions.count()).toBeGreaterThan(0);
  });

  test('send button is disabled when input is empty and enabled after typing', async ({ page }) => {
    await page.goto('/assistant');

    const sendButton = page.getByRole('button', { name: 'Send message' });
    await expect(sendButton).toBeVisible({ timeout: 10000 });
    await expect(sendButton).toBeDisabled();

    const textInput = page.locator('input[type="text"]');
    await textInput.fill('What is Bitcoin?');
    await expect(sendButton).toBeEnabled();
  });
});
