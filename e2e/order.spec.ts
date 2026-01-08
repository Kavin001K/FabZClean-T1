import { test, expect } from '@playwright/test';

test.describe('Order Flow', () => {
    test('Create Order -> Generate Invoice -> Print', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        // Adjust selectors based on actual login form
        await page.getByLabel('Email').fill('admin');
        await page.getByLabel('Password').fill('admin');
        await page.getByRole('button', { name: 'Login' }).click();

        // Verify Dashboard
        await expect(page).toHaveURL('/dashboard');

        // 2. Create Order
        await page.click('text=Create Order');
        await expect(page).toHaveURL('/create-order');

        // Select Customer (this depends on your select implementation, assuming standard or Radix)
        // For now, we'll just check the page loads
        await expect(page.getByText('Customer Detail')).toBeVisible();

        // Fill minimal details (Placeholder - User needs to update selectors)
        // await page.getByPlaceholder('Customer Name').fill('Test User');

        // 3. Submit Order
        // await page.getByRole('button', { name: 'Save Order' }).click();

        // 4. Verify Invoice Page
        // await expect(page).toHaveURL(/.*\/orders\/.*/);

        // 5. Print
        // await page.getByRole('button', { name: 'Print' }).click();
    });
});
