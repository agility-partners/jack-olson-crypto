import { test } from '@playwright/test';

test('can launch browser', async ({ page }) => {
  console.log('starting');
  await page.goto('https://example.com');
  console.log('finished');
});