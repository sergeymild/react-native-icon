# react-native-icon

Generate a typed `AppIcon` component from your SVG/PNG assets and render any icon
with a single `<IconView />`. SVGs are turned into
[`react-native-svg`](https://github.com/software-mansion/react-native-svg)
components — so they can be **tinted, stroked and recolored at runtime** — while
raster assets (`png`/`jpg`) are rendered through `Image`. The `icon` prop
autocompletes with every icon name you have.

```tsx
import { IconView } from 'react-native-icon';

<IconView icon="heart" size={24} tint="#FF3366" />;
```

> **v2 is a breaking change.** The library no longer ships a native module — icons
> are now pure JS rendered with `react-native-svg`. The old `IconView` native view
> and the `IconPath` raster API were removed. See [Migrating from v1](#migrating-from-v1).

---

## How it works

1. You keep your icons as `.svg` / `.png` / `.jpg` files anywhere in your project.
2. A generator script scans those files and writes a single typed component,
   `AppIcon.tsx`, into the library (`node_modules/react-native-icon/src/types/`).
   - Each SVG is **normalized**: `fill`/`stroke` colors are hoisted to the root
     `<svg>` element (so one prop can recolor the whole icon), and elements that
     `react-native-svg` can't render (e.g. `<filter>`) are stripped.
   - Each SVG is classified as **`fill`**, **`stroke`**, or **`both`** — this
     decides which prop recolors it (see [Recoloring icons](#recoloring-icons)).
3. `<IconView />` renders the generated component by name.

---

## Requirements

| Package                         | Why                                            |
| ------------------------------- | ---------------------------------------------- |
| `react-native-svg`              | Renders the generated SVG components (peer dep). |
| `react-native-svg-transformer`  | Lets Metro import `.svg` files as components.   |

Tested with React Native 0.75.

---

## Installation

### 1. Install the packages

```sh
# npm
npm install react-native-icon react-native-svg
npm install --save-dev react-native-svg-transformer

# yarn
yarn add react-native-icon react-native-svg
yarn add -D react-native-svg-transformer
```

### 2. iOS — install pods

```sh
cd ios && pod install && cd ..
```

This links `react-native-svg`'s native code (`RNSVG`).

### 3. Configure Metro

`react-native-svg-transformer` makes Metro treat `.svg` files as React
components instead of static assets. Update (or create) `metro.config.js`:

```js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/** @type {import('metro-config').MetroConfig} */
const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    // Remove svg from assets, add it to source so it's transformed.
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

> After changing `metro.config.js`, restart Metro with a clean cache:
> `npx react-native start --reset-cache`.

### 4. Add the generator scripts

The generator needs its own dependencies installed once, then runs on demand.
Add these to your app's `package.json`:

```jsonc
"scripts": {
  // installs the generator's dependencies (run once / on CI)
  "installIconsDeps": "cd node_modules/react-native-icon/scripts/icons && yarn",
  // scans this project for .svg/.png/.jpg and (re)generates AppIcon.tsx
  "generateIcons": "node node_modules/react-native-icon/scripts/icons/generate.js .",
  // keep icons in sync after every install
  "postinstall": "yarn installIconsDeps && yarn generateIcons"
}
```

The argument `.` is the folder to scan (your project root). To scan a specific
folder, pass its path, e.g. `node .../generate.js ./assets/icons`.

### 5. Generate the icons

```sh
yarn installIconsDeps   # first time only
yarn generateIcons
```

Re-run `yarn generateIcons` whenever you add, remove, or change an icon file.

> **TypeScript:** `AppIcon.tsx` is generated into the library and is **not**
> committed to source control. Run `generateIcons` before typechecking / building
> (the `postinstall` script above handles this automatically).

---

## Usage

```tsx
import { IconView } from 'react-native-icon';

export function Toolbar() {
  return (
    <>
      {/* size sets both width and height */}
      <IconView icon="heart" size={24} />

      {/* recolor — see "Recoloring icons" for which prop to use */}
      <IconView icon="heart" size={24} tint="#FF3366" />

      {/* raster icons support resizeMode */}
      <IconView icon="logo" size={48} resizeMode="contain" />

      {/* custom sizing / layout */}
      <IconView icon="heart" contentStyle={{ width: 18, height: 18 }} />
      <IconView icon="heart" size={24} containerStyle={{ padding: 8 }} />
    </>
  );
}
```

### Recoloring icons

The right color prop depends on the icon's **type** (detected at generation time
and stored in the generated `ICON_META`):

| Icon type | Use this prop      | Notes                                                                 |
| --------- | ------------------ | --------------------------------------------------------------------- |
| `fill`    | `tint` or `color`  | A solid/filled icon. Using `stroke` here adds an outline on top of the existing fill (you'll see two colors). |
| `stroke`  | `stroke` or `tint` | An outline icon.                                                       |
| `both`    | `color`            | Recolors fill **and** stroke together. Use `tint`/`stroke` to set them independently. |

Rule of thumb: **use `tint` for filled icons, `stroke` for outline icons, and
`color` when you just want one uniform color regardless of type.**

```tsx
<IconView icon="calendar"  size={24} tint="#E0245E" />   // fill icon  → solid red
<IconView icon="send"      size={24} stroke="#3366FF" /> // stroke icon → blue outline
<IconView icon="badge"     size={24} color="#111111" />  // both       → uniform color
```

### Props

| Prop             | Type                                 | Description                                                          |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------- |
| `icon`           | generated `AppIconType`              | Icon name. Autocompletes with every generated icon.                 |
| `size`           | `number`                             | Square size; sets both width and height.                            |
| `tint`           | `string`                             | Tint color (applies to fill or stroke depending on the icon type).  |
| `stroke`         | `string`                             | Stroke color (for outline icons).                                   |
| `color`          | `string`                             | Uniform color applied to fill and/or stroke per the icon's type.    |
| `resizeMode`     | `ImageResizeMode`                    | For raster (png/jpg) icons.                                         |
| `scale`          | `number`                             | Divides the icon's intrinsic size (e.g. `scale={2}` = half size).   |
| `style`          | `StyleProp<ViewStyle>`               | Style for the icon element.                                        |
| `contentStyle`   | `StyleProp<ViewStyle \| ImageStyle>` | `width`/`height` here are used to size the icon.                    |
| `containerStyle` | `StyleProp<ViewStyle>`               | When set, wraps the icon in a container `View` with this style.    |
| `testID`         | `string`                             | Forwarded to the icon's host view (as its accessibility label).    |

---

## Troubleshooting

- **Icons render blank / `.svg` imported as a number** — Metro isn't transforming
  SVGs. Recheck step 3 and restart Metro with `--reset-cache`.
- **`Cannot find module './types/AppIcon'`** — run `yarn generateIcons` (it's
  generated, not shipped).
- **A recolor shows two colors** — you're using `stroke` on a `fill` icon (or vice
  versa). See [Recoloring icons](#recoloring-icons).
- **Duplicate icon name error during generation** — two asset files share the same
  base name; rename one. Names are sanitized (camelCase → snake_case, dashes →
  underscores).

---

## Migrating from v1

v1 moved icons into native code and exposed a native `IconView` plus an
`IconPath` raster helper. v2 removes all native code and renders with
`react-native-svg`.

| v1                                                | v2                                                        |
| ------------------------------------------------- | --------------------------------------------------------- |
| `move_to_native.js` generator                     | `generate.js` generator                                   |
| native `IconView` (no extra deps)                 | JS `IconView` + `react-native-svg` (+ transformer)        |
| `import { IconView, IconPath }`                   | `import { IconView }` (no `IconPath`)                      |
| `<Image source={{ uri: IconPath.cube() }} />`     | `<IconView icon="cube" />` (raster handled internally)    |
| `style` required width/height                     | `size` / `contentStyle` / `style`                         |

Steps: install `react-native-svg` + `react-native-svg-transformer`, add the Metro
config (step 3), swap `generateIcons` to `generate.js`, replace `IconPath` usages
with `<IconView icon="..." />`, and run `pod install`.

---

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
