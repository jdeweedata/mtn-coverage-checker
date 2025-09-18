// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('MTN South Africa Coverage Tests', () => {
  test('should load MTN coverage page', async ({ page }) => {
    await page.goto('/home/coverage/');

    // Check if the page loaded successfully
    await expect(page).toHaveTitle(/coverage|mtn/i);

    // Take a screenshot for verification
    await page.screenshot({ path: 'screenshots/mtn-coverage-page.png', fullPage: true });
  });

  test('should be able to search for coverage by address', async ({ page }) => {
    await page.goto('/home/coverage/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Look for common search elements
    const searchSelectors = [
      'input[type="text"]',
      'input[placeholder*="address"]',
      'input[placeholder*="location"]',
      'input[placeholder*="search"]',
      '[data-testid="address-input"]',
      '#address',
      '.search-input'
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        searchInput = await page.locator(selector).first();
        if (await searchInput.isVisible()) {
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (searchInput && await searchInput.isVisible()) {
      // Try to fill in a test address
      await searchInput.fill('Johannesburg');

      // Look for search/submit button
      const buttonSelectors = [
        'button[type="submit"]',
        'button:has-text("search")',
        'button:has-text("check")',
        '.search-button',
        '[data-testid="search-button"]'
      ];

      for (const buttonSelector of buttonSelectors) {
        try {
          const button = page.locator(buttonSelector).first();
          if (await button.isVisible()) {
            await button.click();
            break;
          }
        } catch (e) {
          // Continue to next button
        }
      }

      // Take screenshot after search
      await page.screenshot({ path: 'screenshots/mtn-coverage-search.png', fullPage: true });
    } else {
      console.log('No search input found on the page');
      await page.screenshot({ path: 'screenshots/mtn-coverage-no-search.png', fullPage: true });
    }
  });

  test('should test coverage API endpoints', async ({ page }) => {
    // Test the coverage API directly
    const response = await page.request.get('/home/coverage/query', {
      params: {
        lat: '-26.2041',
        lng: '28.0473'
      }
    });

    console.log('Coverage API Response Status:', response.status());

    if (response.ok()) {
      const data = await response.json();
      console.log('Coverage API Response:', data);
    }
  });

  test('should test WMS endpoint availability', async ({ page }) => {
    // Test if the WMS endpoint is accessible
    const wmsUrl = 'https://mtnsi.mtn.co.za/geoserver/wms?service=WMS&version=1.1.1&request=GetCapabilities';

    try {
      const response = await page.request.get(wmsUrl);
      console.log('WMS Endpoint Status:', response.status());

      if (response.ok()) {
        const text = await response.text();
        console.log('WMS Response length:', text.length);
      }
    } catch (error) {
      console.log('WMS Endpoint Error:', error.message);
    }
  });

  test('should check mobile responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/home/coverage/');

    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/mtn-coverage-mobile.png', fullPage: true });

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'screenshots/mtn-coverage-tablet.png', fullPage: true });

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'screenshots/mtn-coverage-desktop.png', fullPage: true });
  });
});