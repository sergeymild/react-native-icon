/* Detox e2e: verifies the generated AppIcon components render on screen.
 *
 * Each icon in App.tsx is wrapped in a View with a testID; RN maps a View's
 * testID to the iOS accessibilityIdentifier, so Detox `by.id()` resolves it.
 */
describe('AppIcon rendering', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('renders all icons (fill, tint, stroke, raster, aspect-ratio)', async () => {
    await expect(element(by.id('icon-some_icon'))).toBeVisible();
    await expect(element(by.id('icon-letter'))).toBeVisible();
    await expect(element(by.id('icon-ic_calendar'))).toBeVisible();
    await expect(element(by.id('icon-cube'))).toBeVisible();
    await expect(element(by.id('icon-pill-width'))).toBeVisible();
    await expect(element(by.id('icon-pill-height'))).toBeVisible();
  });

  it('captures a screenshot of the icon screen', async () => {
    // Visual artifact for manual/regression inspection.
    await device.takeScreenshot('icons-screen');
  });
});
