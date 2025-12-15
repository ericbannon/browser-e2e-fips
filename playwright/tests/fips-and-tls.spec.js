const { test, expect } = require('@playwright/test');

test('loads the AUT via the TLS proxy', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/nginx/i);
});
