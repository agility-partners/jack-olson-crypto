import { test, expect } from '@playwright/test';

test.describe('Flappy Crypto Mini Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open mini game modal when button is clicked', async ({ page }) => {
    // Find and click the "Play Mini Game" button
    const playButton = page.locator('button:has-text("Play Mini Game")');
    await expect(playButton).toBeVisible();
    
    await playButton.click();
    
    // Wait for modal to appear
    const modal = page.locator('[class*="modal"]');
    await expect(modal).toBeVisible();
  });

  test('should display game controls in modal', async ({ page }) => {
    const playButton = page.locator('button:has-text("Play Mini Game")');
    await playButton.click();
    
    // Check for Play button in modal
    const gamePlayBtn = page.locator('button:has-text("Play")');
    await expect(gamePlayBtn).toBeVisible();
    
    // Check for instructions
    const instructions = page.locator('text=Press SPACE to flap');
    await expect(instructions).toBeVisible();
  });

  test('should close modal when X button is clicked', async ({ page }) => {
    const playButton = page.locator('button:has-text("Play Mini Game")');
    await playButton.click();
    
    // Find and click close button
    const closeBtn = page.locator('button:has-text("✕")');
    await expect(closeBtn).toBeVisible();
    
    await closeBtn.click();
    
    // Modal should be gone
    const modal = page.locator('[class*="modal"]');
    await expect(modal).not.toBeVisible();
  });
});
