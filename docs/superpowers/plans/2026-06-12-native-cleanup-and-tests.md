# Native Cleanup + Tests + Example Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the now-dead native code, make the library's dependencies correct, cover the SVG-processing core and components with tests, and restore the example app to a working state with Detox e2e.

**Architecture:** The library is now pure JS over `react-native-svg`: a generator (`scripts/icons/combinedGenerator.js`) turns SVG/PNG assets into a `AppIcon.tsx` React component, and `src/IconView.tsx` wraps it. We delete the orphaned native module, refactor the regex-based SVG processor into a pure, unit-testable function (guarded by golden snapshots), add render tests for `IconView`, fix the example app (svg-transformer + `react-native-svg` + new API), and add Detox e2e on the iOS simulator.

**Tech Stack:** TypeScript, React Native 0.75.4, React 18.2, `react-native-svg`, `react-native-svg-transformer`, Jest 29, `@testing-library/react-native`, `react-test-renderer`, Detox.

---

## File Structure

**Deleted (dead native):**
- `android/` (whole) — `IconPackage.java`, `IconViewManager.java`, `build.gradle`, `gradle.properties`, `AndroidManifest.xml`, `res/drawable*`
- `ios/` (whole) — `IconViewManager.m`, `Icon.xcodeproj`, `IconImages.xcassets/*`
- `react-native-icon.podspec`

**Deleted (dead generators — no caller):**
- `scripts/icons/iconsGenerator.js`
- `scripts/icons/local_image_generator.js`

**Created:**
- `scripts/icons/__tests__/svgProcessor.golden.test.js` — golden snapshot of current output (safety net before refactor)
- `scripts/icons/__tests__/svgProcessor.test.js` — unit tests for `processSvgContent`
- `scripts/icons/__tests__/combinedGenerator.test.js` — generator-output assertions
- `scripts/icons/__tests__/fixtures/*.svg` — controlled SVG fixtures
- `src/__tests__/IconView.test.tsx` — render/prop-forwarding tests (AppIcon mocked)
- `jest.config.js` — jest config
- `example/.detoxrc.js`, `example/e2e/jest.config.js`, `example/e2e/icons.test.js` — Detox e2e
- `example/src/types/AppIcon.tsx` — regenerated (committed for the example)

**Modified:**
- `scripts/icons/svgProcessor.js` — split pure `processSvgContent` from `processSvgFile`
- `package.json` — drop native from `files`/`clean`/devDeps; add `react-native-svg` peer; add test devDeps + jest config
- `example/package.json` — add `react-native-svg` + transformer; fix `generateIcons`; add `e2e` scripts
- `example/metro.config.js` — wire svg-transformer
- `example/src/App.tsx` — rewrite to new `IconView` API

---

## Phase 1 — Delete dead native + dead generators

### Task 1: Remove native module and dead generator scripts

**Files:**
- Delete: `android/` (recursively), `ios/` (recursively), `react-native-icon.podspec`
- Delete: `scripts/icons/iconsGenerator.js`, `scripts/icons/local_image_generator.js`

- [ ] **Step 1: Confirm no source references the native view manager**

Run: `git grep -nE "requireNativeComponent|getViewManagerConfig|IconViewManager|IconPackage|IconPath" -- src/ scripts/ example/src/`
Expected: no matches in `src/` or `scripts/` (only `example/src/App.tsx` still references `IconPath`, fixed in Phase 4). If any match in `src/`/`scripts/`, STOP and reassess.

- [ ] **Step 2: Confirm dead generators have no caller**

Run: `git grep -nE "iconsGenerator|local_image_generator" -- scripts/ package.json example/package.json`
Expected: matches only inside the two files themselves (self-reference in comments). `generate.js` must reference only `combinedGenerator.js`.

- [ ] **Step 3: Delete the files**

```bash
git rm -r android ios react-native-icon.podspec
git rm scripts/icons/iconsGenerator.js scripts/icons/local_image_generator.js
```

- [ ] **Step 4: Verify nothing else imports deleted paths**

Run: `git grep -nE "\.podspec|com/icon|IconImages" -- . ':!docs' ':!yarn.lock' ':!example/yarn.lock' ':!example/ios/Podfile.lock'`
Expected: no matches outside generated lockfiles/docs.

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: remove dead native module and unused generator scripts"
```

### Task 2: Strip native references from `package.json`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Edit `files`, `scripts.clean`, devDeps**

In `package.json`:

Replace the `files` array with (drops `android`, `ios`, `cpp`, `*.podspec` and their excludes):

```json
  "files": [
    "src",
    "lib",
    "scripts",
    "!lib/typescript/example",
    "!**/__tests__",
    "!**/__fixtures__",
    "!**/__mocks__",
    "!**/.*"
  ],
```

Replace the `clean` script (drop `android/build`):

```json
    "clean": "del-cli example/android/build example/android/app/build example/ios/build",
```

Remove the `pod-install` devDependency line:

```json
    "pod-install": "^0.1.0",
```

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "require('./package.json'); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: drop native fields from package.json"
```

---

## Phase 2 — Library correctness

### Task 3: Declare `react-native-svg` peer dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the peer dependency**

In `package.json`, change `peerDependencies` to:

```json
  "peerDependencies": {
    "react": "*",
    "react-native": "*",
    "react-native-svg": "*"
  },
```

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "require('./package.json'); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: declare react-native-svg peer dependency"
```

---

## Phase 3 — Refactor `svgProcessor` + unit tests (TDD with golden safety net)

### Task 4: Add Jest to the library

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`

- [ ] **Step 1: Add test devDependencies**

In `package.json` `devDependencies`, add (keep alphabetical-ish, exact versions):

```json
    "@testing-library/react-native": "^12.9.0",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "react-test-renderer": "18.2.0",
```

- [ ] **Step 2: Create `jest.config.js`**

```js
module.exports = {
  preset: 'react-native',
  // svgProcessor + generator tests are plain Node; IconView tests use the RN preset.
  setupFilesAfterEnv: ['@testing-library/react-native/extend-expect'],
  moduleNameMapper: {
    // Mock the generated AppIcon for IconView unit tests.
    '^./types/AppIcon$': '<rootDir>/src/__tests__/__mocks__/AppIcon.tsx',
  },
  testMatch: ['**/__tests__/**/*.test.{js,ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@testing-library)/)',
  ],
}
```

- [ ] **Step 3: Install**

Run: `yarn install`
Expected: completes without error; `node_modules/.bin/jest` exists.

- [ ] **Step 4: Verify jest runs (no tests yet is OK)**

Run: `yarn jest --passWithNoTests`
Expected: `No tests found` / passes.

- [ ] **Step 5: Commit**

```bash
git add package.json jest.config.js yarn.lock
git commit -m "test: add jest + react-native testing setup"
```

### Task 5: Capture golden snapshot of current SVG processor output

This freezes current behavior BEFORE the refactor. `processSvgFile` mutates files in place, so the test copies a fixture to a temp file, processes it, and snapshots the result.

**Files:**
- Create: `scripts/icons/__tests__/fixtures/fill-icon.svg`
- Create: `scripts/icons/__tests__/fixtures/stroke-icon.svg`
- Create: `scripts/icons/__tests__/fixtures/both-icon.svg`
- Create: `scripts/icons/__tests__/svgProcessor.golden.test.js`

- [ ] **Step 1: Create fixtures**

`scripts/icons/__tests__/fixtures/fill-icon.svg`:

```xml
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 4h16v16H4z" fill="#1A1A1A"/>
<circle cx="12" cy="12" r="3" fill="#1A1A1A" fill-opacity="0.5"/>
</svg>
```

`scripts/icons/__tests__/fixtures/stroke-icon.svg`:

```xml
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 12h16" stroke="#1A1A1A" stroke-width="2"/>
<rect x="4" y="4" width="16" height="16" fill="#FF0000"/>
</svg>
```

`scripts/icons/__tests__/fixtures/both-icon.svg`:

```xml
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<path d="M4 4h16v16H4z" fill="#1A1A1A" stroke="#1A1A1A"/>
<circle cx="12" cy="12" r="3" fill="#1A1A1A"/>
<line x1="0" y1="0" x2="24" y2="24" stroke="#1A1A1A"/>
<filter id="f"><feGaussianBlur stdDeviation="2"/></filter>
</svg>
```

- [ ] **Step 2: Write the golden test**

`scripts/icons/__tests__/svgProcessor.golden.test.js`:

```js
const fs = require('fs')
const os = require('os')
const path = require('path')
const { processSvgFile } = require('../svgProcessor')

const FIXTURES = path.join(__dirname, 'fixtures')

function processCopy(name) {
  const tmp = path.join(os.tmpdir(), `golden-${name}-${process.pid}.svg`)
  fs.copyFileSync(path.join(FIXTURES, name), tmp)
  const result = processSvgFile(tmp)
  const content = fs.readFileSync(tmp, 'utf-8')
  fs.unlinkSync(tmp)
  return { result, content }
}

describe('processSvgFile golden output', () => {
  for (const name of ['fill-icon.svg', 'stroke-icon.svg', 'both-icon.svg']) {
    it(`${name} matches snapshot`, () => {
      const { result, content } = processCopy(name)
      expect({ result, content }).toMatchSnapshot()
    })
  }
})
```

- [ ] **Step 3: Run to create the snapshot**

Run: `yarn jest scripts/icons/__tests__/svgProcessor.golden.test.js`
Expected: PASS, `1 snapshot written` (3 snapshots). Inspect the snapshot file to confirm `fill="none"` placement and filter removal look sane.

- [ ] **Step 4: Commit the safety net**

```bash
git add scripts/icons/__tests__/fixtures scripts/icons/__tests__/svgProcessor.golden.test.js scripts/icons/__tests__/__snapshots__
git commit -m "test: golden snapshot of current svgProcessor output"
```

### Task 6: Refactor `processSvgFile` into pure `processSvgContent`

Behavior must not change — the golden test from Task 5 is the guard.

**Files:**
- Modify: `scripts/icons/svgProcessor.js`

- [ ] **Step 1: Extract the pure function**

In `scripts/icons/svgProcessor.js`, change the top of `processSvgFile` so the file read is the only fs operation there, and all string logic moves into `processSvgContent(content)`.

Replace lines 5–6:

```js
function processSvgFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
```

with:

```js
// Pure: takes SVG string, returns { content, type, modified }.
// Moves fill/stroke from child elements to the root <svg> element.
function processSvgContent(content) {
```

- [ ] **Step 2: Replace the final write+return block**

Replace the file's tail (the `fs.writeFileSync(filePath, content, 'utf-8')` line near the end and the closing `return { type: iconType, modified }`) so the pure function returns the string and a thin wrapper does the IO.

Change near the end of the `if (modified) { ... }` block — remove:

```js
    // Save updated file
    fs.writeFileSync(filePath, content, 'utf-8')
  }

  return { type: iconType, modified }
}

module.exports = { processSvgFile }
```

to:

```js
  }

  return { content, type: iconType, modified }
}

// Thin fs wrapper around processSvgContent. Preserves original behavior:
// reads the file, processes, writes back only when modified.
function processSvgFile(filePath) {
  const input = fs.readFileSync(filePath, 'utf-8')
  const { content, type, modified } = processSvgContent(input)
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8')
  }
  return { type, modified }
}

module.exports = { processSvgContent, processSvgFile }
```

Note: the early-return `if (!svgMatch) return { type: 'fill', modified: false }` inside `processSvgContent` must also return `content`. Change it to:

```js
  if (!svgMatch) return { content, type: 'fill', modified: false }
```

- [ ] **Step 3: Run golden test to confirm no behavior change**

Run: `yarn jest scripts/icons/__tests__/svgProcessor.golden.test.js`
Expected: PASS, `3 snapshots passed`, `0 written`. If any snapshot differs, the refactor changed behavior — fix until identical.

- [ ] **Step 4: Commit**

```bash
git add scripts/icons/svgProcessor.js
git commit -m "refactor: extract pure processSvgContent from processSvgFile"
```

### Task 7: Unit tests for `processSvgContent`

**Files:**
- Create: `scripts/icons/__tests__/svgProcessor.test.js`

- [ ] **Step 1: Write the unit tests**

`scripts/icons/__tests__/svgProcessor.test.js`:

```js
const { processSvgContent } = require('../svgProcessor')

const svg = (inner, rootAttrs = 'fill="none"') =>
  `<svg width="24" height="24" ${rootAttrs}>${inner}</svg>`

describe('processSvgContent', () => {
  it('detects fill-only icons and hoists fill to root', () => {
    const { type, content } = processSvgContent(svg('<path d="M0 0" fill="#123456"/>'))
    expect(type).toBe('fill')
    expect(content).toMatch(/<svg[^>]*fill="#123456"/)
  })

  it('detects stroke-only icons and keeps fill="none" on root', () => {
    const { type, content } = processSvgContent(svg('<path d="M0 0" stroke="#123456"/>'))
    expect(type).toBe('stroke')
    expect(content).toMatch(/<svg[^>]*fill="none"/)
    expect(content).toMatch(/<svg[^>]*stroke="#123456"/)
  })

  it('detects "both" when root has explicit fill and stroke colors', () => {
    const { type } = processSvgContent(
      svg('<path d="M0 0"/>', 'fill="#111111" stroke="#222222"')
    )
    expect(type).toBe('both')
  })

  it('respects explicit root fill="none" + stroke color as stroke-only', () => {
    const { type } = processSvgContent(
      svg('<path d="M0 0"/>', 'fill="none" stroke="#222222"')
    )
    expect(type).toBe('stroke')
  })

  it('does NOT strip fill from children that have fill-opacity', () => {
    const { content } = processSvgContent(
      svg('<circle fill="#123456" fill-opacity="0.5"/>')
    )
    expect(content).toMatch(/fill="#123456"/)
  })

  it('does NOT strip stroke from children that have stroke-opacity', () => {
    const { content } = processSvgContent(
      svg('<path stroke="#123456" stroke-opacity="0.5"/>')
    )
    expect(content).toMatch(/stroke="#123456"/)
  })

  it('removes <filter> blocks and filter attributes', () => {
    const { content } = processSvgContent(
      svg('<path d="M0 0" fill="#123456" filter="url(#f)"/><filter id="f"><feGaussianBlur/></filter>')
    )
    expect(content).not.toMatch(/<filter/)
    expect(content).not.toMatch(/filter="url\(#f\)"/)
  })

  it('keeps clipPath (supported by react-native-svg)', () => {
    const { content } = processSvgContent(
      svg('<clipPath id="c"><rect/></clipPath><path d="M0 0" fill="#123456" clip-path="url(#c)"/>')
    )
    expect(content).toMatch(/clipPath/)
    expect(content).toMatch(/clip-path="url\(#c\)"/)
  })

  it('handles color values containing regex special chars without throwing', () => {
    expect(() =>
      processSvgContent(svg('<path d="M0 0" fill="url(#grad)"/>'))
    ).not.toThrow()
  })

  it('is idempotent: re-processing produces identical output', () => {
    const first = processSvgContent(svg('<path d="M0 0" stroke="#123456"/>'))
    const second = processSvgContent(first.content)
    expect(second.content).toBe(first.content)
  })

  it('returns modified=false and original content when no <svg> tag', () => {
    const input = '<not-svg/>'
    const { modified, content, type } = processSvgContent(input)
    expect(modified).toBe(false)
    expect(content).toBe(input)
    expect(type).toBe('fill')
  })
})
```

- [ ] **Step 2: Run the tests**

Run: `yarn jest scripts/icons/__tests__/svgProcessor.test.js`
Expected: PASS, 11 passing. If the "idempotent" or "both" cases fail, that reveals a real bug — STOP and report to the user before changing production logic (the golden snapshot pins current behavior; changing it is a separate decision).

- [ ] **Step 3: Commit**

```bash
git add scripts/icons/__tests__/svgProcessor.test.js
git commit -m "test: unit tests for processSvgContent"
```

### Task 8: Generator-output assertions

**Files:**
- Create: `scripts/icons/__tests__/combinedGenerator.test.js`

- [ ] **Step 1: Write the test**

`scripts/icons/__tests__/combinedGenerator.test.js`:

```js
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execSync } = require('child_process')

const SCRIPTS_DIR = path.join(__dirname, '..')
const FIXTURES = path.join(__dirname, 'fixtures')

describe('combinedGenerator', () => {
  let projectDir
  let outDir

  beforeAll(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'icons-proj-'))
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'icons-out-'))
    // Copy SVG fixtures (use copies so the generator can mutate them).
    for (const f of ['fill-icon.svg', 'stroke-icon.svg']) {
      fs.copyFileSync(path.join(FIXTURES, f), path.join(projectDir, f))
    }
    execSync(`node "${path.join(SCRIPTS_DIR, 'combinedGenerator.js')}"`, {
      cwd: SCRIPTS_DIR,
      env: { ...process.env, ICONS_PROJECT_DIR: projectDir, ICONS_OUTPUT_DIR: outDir },
      stdio: 'pipe',
    })
  })

  it('emits AppIcon.tsx', () => {
    expect(fs.existsSync(path.join(outDir, 'AppIcon.tsx'))).toBe(true)
  })

  it('includes a union type and switch case per svg', () => {
    const out = fs.readFileSync(path.join(outDir, 'AppIcon.tsx'), 'utf-8')
    expect(out).toMatch(/export type AppIconType =/)
    expect(out).toMatch(/case 'fill-icon'/)
    expect(out).toMatch(/case 'stroke-icon'/)
  })

  it('records svgType metadata (fill vs stroke)', () => {
    const out = fs.readFileSync(path.join(outDir, 'AppIcon.tsx'), 'utf-8')
    expect(out).toMatch(/'fill-icon': \{ kind: 'svg', svgType: 'fill' \}/)
    expect(out).toMatch(/'stroke-icon': \{ kind: 'svg', svgType: 'stroke' \}/)
  })
})
```

- [ ] **Step 2: Run the test**

Run: `yarn jest scripts/icons/__tests__/combinedGenerator.test.js`
Expected: PASS, 3 passing.

- [ ] **Step 3: Commit**

```bash
git add scripts/icons/__tests__/combinedGenerator.test.js
git commit -m "test: assert combinedGenerator output shape"
```

---

## Phase 4 — Render tests for `IconView`

### Task 9: Mock AppIcon + IconView render tests

`IconView` imports the generated `./types/AppIcon`, which is not in the repo. We mock it (mapped in `jest.config.js` from Task 4) with a fake that records the props it receives, so we can assert IconView's prop-forwarding and dimension logic in isolation.

**Files:**
- Create: `src/__tests__/__mocks__/AppIcon.tsx`
- Create: `src/__tests__/IconView.test.tsx`

- [ ] **Step 1: Create the AppIcon mock**

`src/__tests__/__mocks__/AppIcon.tsx`:

```tsx
import React from 'react'
import { View } from 'react-native'

export type AppIconType = 'test-icon'

// Records all props on a host View via testID so tests can read them back.
const AppIcon = React.forwardRef<View, any>((props, ref) => (
  <View
    ref={ref}
    testID="app-icon"
    // Stash props as a JSON string for assertions.
    accessibilityValue={{ text: JSON.stringify(props) }}
  />
))

export default AppIcon
```

- [ ] **Step 2: Write the failing test**

`src/__tests__/IconView.test.tsx`:

```tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { IconView } from '../IconView'

function readProps(getByTestId: any) {
  const node = getByTestId('app-icon')
  return JSON.parse(node.props.accessibilityValue.text)
}

describe('IconView', () => {
  it('forwards icon type, tint, stroke, color, resizeMode', () => {
    const { getByTestId } = render(
      <IconView
        icon={'test-icon' as any}
        tint="#111"
        stroke="#222"
        color="#333"
        resizeMode="contain"
      />
    )
    const p = readProps(getByTestId)
    expect(p.type).toBe('test-icon')
    expect(p.tint).toBe('#111')
    expect(p.stroke).toBe('#222')
    expect(p.color).toBe('#333')
    expect(p.resizeMode).toBe('contain')
  })

  it('maps size prop into width/height', () => {
    const { getByTestId } = render(<IconView icon={'test-icon' as any} size={40} />)
    const p = readProps(getByTestId)
    expect(p.width).toBe(40)
    expect(p.height).toBe(40)
    expect(p.size).toBe(40)
  })

  it('derives width/height from contentStyle dimensions', () => {
    const { getByTestId } = render(
      <IconView icon={'test-icon' as any} contentStyle={{ width: 50, height: 60 }} />
    )
    const p = readProps(getByTestId)
    expect(p.width).toBe(50)
    expect(p.height).toBe(60)
  })

  it('wraps in a container View when containerStyle is given', () => {
    const { getByTestId } = render(
      <IconView icon={'test-icon' as any} containerStyle={{ padding: 8 }} />
    )
    // Still renders the icon inside.
    expect(getByTestId('app-icon')).toBeTruthy()
  })
})
```

- [ ] **Step 3: Run to verify it passes**

Run: `yarn jest src/__tests__/IconView.test.tsx`
Expected: PASS, 4 passing. If a prop name mismatches (e.g. IconView does not forward `resizeMode`), that is a real finding — fix `src/IconView.tsx` only if it is a genuine bug, otherwise adjust the assertion to the documented behavior and note it.

- [ ] **Step 4: Run the whole suite**

Run: `yarn test`
Expected: all suites green (golden + unit + generator + IconView).

- [ ] **Step 5: Commit**

```bash
git add src/__tests__ jest.config.js
git commit -m "test: IconView prop-forwarding render tests"
```

---

## Phase 5 — Fix the example app

### Task 10: Wire react-native-svg + transformer into the example

**Files:**
- Modify: `example/package.json`
- Modify: `example/metro.config.js`

- [ ] **Step 1: Add deps + scripts to `example/package.json`**

Add to `dependencies`:

```json
    "react-native-svg": "15.8.0"
```

Add to `devDependencies`:

```json
    "react-native-svg-transformer": "^1.5.0"
```

Replace the `generateIcons` script and add e2e scripts:

```json
    "generateIcons": "node ../scripts/icons/generate.js .",
    "e2e:build": "detox build --configuration ios.sim.debug",
    "e2e:test": "detox test --configuration ios.sim.debug"
```

- [ ] **Step 2: Wire the transformer in `example/metro.config.js`**

Replace the file with (adds svg transformer while keeping the existing peer-dep resolver):

```js
const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const pak = require('../package.json');

const root = path.resolve(__dirname, '..');

const modules = Object.keys({
  ...pak.peerDependencies,
});

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  projectRoot: __dirname,
  watchFolders: [root],

  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },

  resolver: {
    // Treat .svg as source (transformed to components), not as an asset.
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],

    // We need to make sure that only one version is loaded for peerDependencies
    // So we block them at the root, and alias them to the versions in example's node_modules
    blockList: modules.map(
      (m) =>
        new RegExp(`^${path.join(root, 'node_modules', m).replace(/[/\\]/g, '[/\\\\]')}[\\/\\\\].*$`)
    ),

    extraNodeModules: modules.reduce((acc, name) => {
      acc[name] = path.join(__dirname, 'node_modules', name);
      return acc;
    }, {}),
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

- [ ] **Step 3: Verify JSON + JS validity**

Run: `node -e "require('./example/package.json'); console.log('ok')"`
Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add example/package.json example/metro.config.js
git commit -m "fix(example): wire react-native-svg + svg-transformer"
```

### Task 11: Regenerate icons and rewrite `App.tsx`

**Files:**
- Create/Modify: `example/src/types/AppIcon.tsx` (generated)
- Modify: `example/src/App.tsx`

- [ ] **Step 1: Install example deps**

Run: `yarn --cwd example install`
Expected: installs `react-native-svg` + transformer.

- [ ] **Step 2: Generate the AppIcon component**

Run: `cd example && yarn generateIcons && cd ..`
Expected: creates `example/src/types/AppIcon.tsx` with types `'cube' | 'ic_calendar' | 'letter' | 'some_icon'` (cube is a PNG → `kind: 'image'`).

- [ ] **Step 3: Confirm generated output**

Run: `git status --short example/src/types && head -30 example/src/types/AppIcon.tsx`
Expected: file exists, exports `AppIconType`, imports the svgs, requires `cube.png`.

- [ ] **Step 4: Rewrite `example/src/App.tsx` to the new API**

```tsx
import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import { IconView } from 'react-native-icon';

export default function App() {
  return (
    <View style={styles.container}>
      <IconView icon={'some_icon'} size={60} testID="icon-some_icon" />
      <IconView icon={'letter'} size={60} tint="#3366FF" testID="icon-letter" />
      <IconView icon={'ic_calendar'} size={60} stroke="#E0245E" testID="icon-ic_calendar" />
      <IconView icon={'cube'} size={60} resizeMode="contain" testID="icon-cube" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

Note: `IconView`'s `icon` prop is typed by `AppIconType` from the library's own `./types/AppIcon`. Since the example generates its own AppIcon, the string literals above must match the generated example types. If TS complains about the icon names, regenerate and use the exact generated names.

- [ ] **Step 5: Typecheck the example compiles**

Run: `yarn --cwd example tsc --noEmit` (if the example has no tsconfig, run `yarn typecheck` at root after confirming paths)
Expected: no errors referencing `IconPath` or missing `IconView`.

- [ ] **Step 6: Commit**

```bash
git add example/src/App.tsx example/src/types/AppIcon.tsx
git commit -m "fix(example): regenerate icons, migrate App to new IconView API"
```

### Task 12: Verify the example runs (manual checkpoint)

**Files:** none (verification only)

- [ ] **Step 1: Install pods**

Run: `cd example/ios && pod install && cd ../..`
Expected: installs `RNSVG` pod; no errors.

- [ ] **Step 2: Start metro and launch iOS**

Run: `yarn --cwd example ios`
Expected: app builds and launches in the simulator; four icons render (filled, tinted, stroked, raster cube). If the SVGs render as blank/asset errors, the transformer wiring (Task 10) is wrong — fix before proceeding.

- [ ] **Step 2a: STOP for human confirmation**

This step requires the user to visually confirm the icons render. Report the simulator state and wait for confirmation before Phase 6.

---

## Phase 6 — Detox e2e

### Task 13: Add Detox configuration

**Files:**
- Modify: `example/package.json`
- Create: `example/.detoxrc.js`
- Create: `example/e2e/jest.config.js`

- [ ] **Step 1: Add Detox devDependency to `example/package.json`**

In `devDependencies`:

```json
    "detox": "^20.27.0",
    "jest": "^29.7.0"
```

- [ ] **Step 2: Create `example/.detoxrc.js`**

```js
/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/IconExample.app',
      build:
        "xcodebuild -workspace ios/IconExample.xcworkspace -scheme IconExample -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
  },
};
```

- [ ] **Step 3: Create `example/e2e/jest.config.js`**

```js
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
```

- [ ] **Step 4: Commit**

```bash
git add example/.detoxrc.js example/e2e/jest.config.js example/package.json
git commit -m "test(example): add detox configuration"
```

### Task 14: Detox e2e test for icon rendering

**Files:**
- Create: `example/e2e/icons.test.js`

- [ ] **Step 1: Write the e2e test**

`example/e2e/icons.test.js`:

```js
describe('AppIcon rendering', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('renders all four icons (fill, tint, stroke, raster)', async () => {
    await expect(element(by.id('icon-some_icon'))).toBeVisible();
    await expect(element(by.id('icon-letter'))).toBeVisible();
    await expect(element(by.id('icon-ic_calendar'))).toBeVisible();
    await expect(element(by.id('icon-cube'))).toBeVisible();
  });

  it('matches the icon screen snapshot', async () => {
    // Visual regression: Detox takes a device screenshot artifact.
    await device.takeScreenshot('icons-screen');
  });
});
```

Note: `testID` on `IconView` flows to the generated `AppIcon`'s root `View` via `accessibilityLabel`/`nativeID`. Detox `by.id` matches `testID`/`nativeID`. If `by.id` does not resolve, switch the test to `by.label(...)` matching the `accessibilityLabel` set from `testID`, or thread `testID` through `IconView` to AppIcon's `nativeID`.

- [ ] **Step 2: Build the app for Detox**

Run: `yarn --cwd example e2e:build`
Expected: produces `IconExample.app` under `ios/build/...`. (Requires Xcode + `applesimutils`.)

- [ ] **Step 3: Run the e2e test**

Run: `yarn --cwd example e2e:test`
Expected: both tests pass; a screenshot artifact is produced. This step requires the user's macOS + simulator; if the environment cannot build/run, report the failure output and hand the run to the user rather than marking complete.

- [ ] **Step 4: Commit**

```bash
git add example/e2e/icons.test.js
git commit -m "test(example): detox e2e for icon rendering"
```

---

## Final verification

- [ ] **Step 1: Full library test suite**

Run: `yarn test`
Expected: all green.

- [ ] **Step 2: No dangling native references**

Run: `git grep -nE "requireNativeComponent|IconViewManager|\.podspec" -- . ':!docs' ':!**/yarn.lock' ':!**/Podfile.lock'`
Expected: no matches.

- [ ] **Step 3: Lint**

Run: `yarn lint`
Expected: no new errors in changed files.
