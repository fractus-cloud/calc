import { test, expect } from '@playwright/test';

// Repro: visit sample share link from homepage, then clear; UI should update immediately without manual refresh.

test.describe('Subnets clear after share link', () => {
  test('clearing after sample link resets table promptly', async ({ page }) => {
    await page.goto('/subnets?subnets=eyJ2ZXJzaW9uIjoxLCJpbnB1dCI6IjEwLjEwLjAuMC8yMCIsIm1heE1hc2siOjI2LCJleHBhbmRlZCI6WyIxMC4xMC4wLjAvMjAiLCIxMC4xMC4wLjAvMjEiLCIxMC4xMC44LjAvMjEiLCIxMC4xMC4wLjAvMjIiLCIxMC4xMC4wLjAvMjMiLCIxMC4xMC4yLjAvMjMiXSwibG9ja2VkIjpbIjEwLjEwLjAuMC8yMCIsIjEwLjEwLjAuMC8yMiIsIjEwLjEwLjAuMC8yMyIsIjEwLjEwLjIuMC8yMyIsIjEwLjEwLjAuMC8yNCIsIjEwLjEwLjEuMC8yNCIsIjEwLjEwLjIuMC8yNCIsIjEwLjEwLjMuMC8yNCJdLCJuYW1lcyI6eyIxMC4xMC4wLjAvMjAiOiJDb3JwIC8yMCIsIjEwLjEwLjAuMC8yMSI6IlByaW1hcnkgU2VnbWVudCIsIjEwLjEwLjguMC8yMSI6IlNlY29uZGFyeSBTZWdtZW50IiwiMTAuMTAuMC4wLzIyIjoiQ29yZSAmIERNWiIsIjEwLjEwLjAuMC8yMyI6IkNvcmUiLCIxMC4xMC4yLjAvMjMiOiJETVoiLCIxMC4xMC4wLjAvMjQiOiJBcHAgQSIsIjEwLjEwLjEuMC8yNCI6IkFwcCBCIiwiMTAuMTAuMi4wLzI0IjoiREIiLCIxMC4xMC4zLjAvMjQiOiJNb25pdG9yaW5nIn19');

    // Verify sample data present (a named subnet)
    await expect(page.getByText('Corp /20')).toBeVisible();

    // Trigger clear and accept confirmation
    page.once('dialog', async (dialog) => { await dialog.accept(); });
    await page.getByTestId('clear-subnets').click();

  // After clearing, query param removed. Wait for CIDR input to reflect default, ensuring reactive reset happened.
  await expect(page).toHaveURL(/\/subnets(?!.*subnets=)/);
  const cidrInput = page.getByLabel('CIDR');
  await expect(cidrInput).toHaveValue('10.0.0.0/16');
  // Ensure sample name no longer present
  await expect(page.getByText('Corp /20')).toHaveCount(0);
  });
});
