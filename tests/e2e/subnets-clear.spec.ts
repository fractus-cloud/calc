import { test, expect } from '@playwright/test';

// Test clearing subnet state with confirmation and cancellation

test.describe('Subnets clear button', () => {
  test('cancelling does not clear, confirming clears', async ({ page }) => {
    await page.goto('/subnets');

    // Ensure initial CIDR present
    const cidrInput = page.getByLabel('CIDR');
    await expect(cidrInput).toHaveValue(/.+/);

    // Modify values to detect reset
    await cidrInput.fill('192.168.0.0/16');
    const maxMaskInput = page.getByLabel('Max mask');
    await maxMaskInput.fill('28');
    await expect(maxMaskInput).toHaveValue('28');

    // Click clear and cancel
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.dismiss();
    });
    await page.getByTestId('clear-subnets').click();

    // Values should remain
    await expect(cidrInput).toHaveValue('192.168.0.0/16');
    await expect(maxMaskInput).toHaveValue('28');

    // Click clear and accept
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });
    await page.getByTestId('clear-subnets').click();

    // After clearing, CIDR resets to default and max mask resets to 24
  await expect.poll(async () => await cidrInput.inputValue(), { timeout: 10000 }).toBe('10.0.0.0/16');
    const mmVal = await maxMaskInput.inputValue();
    expect(mmVal).toBe('24');
  });
});
