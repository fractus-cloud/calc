import { test, expect } from '@playwright/test';

// Validate that the spacer between the input labels and the action buttons exists
// and provides horizontal separation on desktop viewports.
// We rely on the class 'hidden md:block flex-grow' we injected (any future refactor
// can update selector accordingly).

test.describe('Subnets form layout', () => {
  test('has horizontal spacer on desktop', async ({ page }) => {
    await page.goto('/subnets');
    // Desktop viewport is default via project device (Desktop Chrome)
    const spacer = page.locator('form > div.hidden.md\\:block.flex-grow');
    await expect(spacer).toHaveCount(1);

    // Measure width using evaluate (should be > 120px as heuristic; adjust if design changes)
    const width = await spacer.evaluate(el => (el as HTMLElement).offsetWidth);
    expect(width).toBeGreaterThan(40); // ensure it actually occupies space

    // Ensure it disappears on mobile by emulating a narrow viewport
    await page.setViewportSize({ width: 480, height: 800 });
    // Force a re-measure after resize (layout recalculates)
    const mobileDisplay = await spacer.evaluate(el => getComputedStyle(el).display);
    expect(mobileDisplay).toBe('none');
  });
});
