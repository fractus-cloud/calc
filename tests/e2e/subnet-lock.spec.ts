import { test, expect } from '@playwright/test';

// Helper selectors kept minimal; using role/text where possible for resilience.

test.describe('Subnet explorer locking & naming', () => {
  test('locked descendant blocks ancestor collapse and remains visible with name', async ({ page }) => {
    await page.goto('/subnets');

    // Ensure initial CIDR present
    await expect(page.getByText('10.0.0.0/16')).toBeVisible();

    // Perform splits down first branch to /19 (three splits: /16 -> /17 -> /18 -> /19)
    for (let i=0;i<3;i++) {
      const firstSplit = page.locator('table tbody tr').filter({ has: page.getByRole('button', { name: 'Split' }) }).first();
      await firstSplit.getByRole('button', { name: 'Split' }).click();
    }

    // Lock a deeper subnet (pick first row with mask /19)
    const targetRow = page.locator('table tbody tr').filter({ hasText: '/19' }).first();
    await targetRow.getByRole('button', { name: 'Lock subnet' }).click();

  // Root collapse should now be blocked (Collapse button disabled)
  const rootRow = page.locator('table tbody tr').first();
  const rootCollapseBtn = rootRow.getByRole('button', { name: 'Collapse' });
  await expect(rootCollapseBtn).toBeDisabled();
  // Locked /19 present
  const lockedRow = page.locator('table tbody tr').filter({ hasText: '/19' }).first();
  await expect(lockedRow).toBeVisible();

    // Add a name to the locked subnet
    await targetRow.getByRole('button', { name: 'Edit name' }).click();
    const nameInput = targetRow.getByPlaceholder('Name');
    await nameInput.fill('Edge Segment');
    await targetRow.getByRole('button', { name: 'Save' }).click();

    await expect(targetRow.getByText('Edge Segment')).toBeVisible();
  });
});
