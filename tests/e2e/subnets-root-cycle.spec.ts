import { test, expect } from '@playwright/test';

test.describe('Root split/expand/join cycle', () => {
  test('root shows correct button states through lifecycle', async ({ page }) => {
    await page.goto('/subnets');

    const rootRow = page.locator('table tbody tr').first();
    const splitBtn = rootRow.getByRole('button', { name: 'Split' });
    const expandBtn = rootRow.getByRole('button', { name: 'Expand' });

    await expect(splitBtn).toBeVisible({ timeout: 10000 });
    await expect(expandBtn).toBeDisabled();

    await splitBtn.click();
    // After split, auto-expanded: Collapse + Join visible
    await expect(rootRow.getByRole('button', { name: 'Join' })).toBeVisible();
    await expect(rootRow.getByRole('button', { name: 'Collapse' })).toBeVisible();

    // Collapse then Join
    await rootRow.getByRole('button', { name: 'Collapse' }).click();
    await rootRow.getByRole('button', { name: 'Join' }).click();

    // Back to initial state
    await expect(rootRow.getByRole('button', { name: 'Split' })).toBeVisible();
    await expect(rootRow.getByRole('button', { name: 'Expand' })).toBeDisabled();
  });
});
