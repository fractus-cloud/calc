import { test, expect } from '@playwright/test';

// Helper selectors kept minimal; using role/text where possible for resilience.

test.describe('Subnet explorer locking & naming', () => {
  test('locked descendant blocks ancestor collapse and remains visible with name', async ({ page }) => {
    await page.goto('/subnets');

    // Ensure initial CIDR present
    await expect(page.getByText('10.0.0.0/16')).toBeVisible();

    // Root initially not split: perform split then expand
    const rootRow = page.locator('table tbody tr').first();
    await expect(rootRow.getByRole('button', { name: 'Split' })).toBeVisible({ timeout: 10000 });
    await rootRow.getByRole('button', { name: 'Split' }).click();
    // Root auto-expanded

    // Perform additional splits down first branch to /19 (need two more splits: /16 -> /17 -> /18 -> /19 is total 3; one done)
    for (let i=0;i<2;i++) {
      const splitButton = page.locator('table tbody tr').filter({ has: page.getByRole('button', { name: 'Split' }) }).last().getByRole('button', { name: 'Split' });
      await expect(splitButton).toBeVisible({ timeout: 10000 });
      await splitButton.click();
    }

    // Lock a deeper subnet (pick first row with mask /19)
    const targetRow = page.locator('table tbody tr').filter({ hasText: '/19' }).first();
    await targetRow.getByRole('button', { name: 'Lock subnet' }).click();

    // Root join should now be disabled (cannot logically join due to locked descendant)
    const rootJoinBtn = rootRow.getByRole('button', { name: 'Join' });
    await expect(rootJoinBtn).toBeDisabled();
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
