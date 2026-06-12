/* Detox e2e: verifies the generated AppIcon components render on screen.
 *
 * NOTE on matchers: IconView forwards `testID` to AppIcon, which sets it as the
 * host View's `accessibilityLabel` (not the iOS accessibilityIdentifier). Detox
 * `by.id()` matches the identifier, so it would NOT resolve here — we match by
 * `by.label()` against the same string the example passes as testID
 * (e.g. "icon-some_icon").
 */
describe('AppIcon rendering', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('renders all four icons (fill, tint, stroke, raster)', async () => {
    await expect(element(by.label('icon-some_icon'))).toBeVisible();
    await expect(element(by.label('icon-letter'))).toBeVisible();
    await expect(element(by.label('icon-ic_calendar'))).toBeVisible();
    await expect(element(by.label('icon-cube'))).toBeVisible();
  });

  it('captures a screenshot of the icon screen', async () => {
    // Visual artifact for manual/regression inspection.
    await device.takeScreenshot('icons-screen');
  });
});
