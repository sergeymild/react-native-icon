# react-native-icon

Generate a typed `AppIcon` component from your SVG/PNG assets. SVGs are rendered
as [`react-native-svg`](https://github.com/software-mansion/react-native-svg)
components (so they can be tinted, stroked and recolored at runtime); raster
assets are rendered through `Image`. You get autocomplete for every icon name and
a single `<IconView />` component to render them.

```tsx
<IconView icon="tomato" size={20} />
```

## Installation

```sh
yarn add react-native-icon react-native-svg
yarn add -D react-native-svg-transformer
```

`react-native-svg` is a peer dependency. Because the generated component imports
`.svg` files as React components, Metro must be configured to transform them.

**`metro.config.js`:**

```js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },
});
```

## Generating icons

Put your `.svg` / `.png` / `.jpg` assets anywhere in your project, then run the
generator, pointing it at your project root:

```jsonc
// package.json
"scripts": {
  // installs the generator's own dependencies
  "installIconsDeps": "cd node_modules/react-native-icon/scripts/icons && yarn",
  // scans the project for assets and (re)generates the AppIcon component
  "generateIcons": "node node_modules/react-native-icon/scripts/icons/generate.js .",
  "postinstall": "yarn installIconsDeps && yarn generateIcons"
}
```

During generation each SVG is normalized: `fill`/`stroke` colors are hoisted to
the root `<svg>` element (so a single `tint`/`stroke`/`color` prop can recolor the
whole icon), and unsupported elements (e.g. `<filter>`) are stripped.

## Usage

```tsx
import { IconView } from 'react-native-icon';

// `icon` autocompletes with every generated icon name.
<IconView icon="tomato" size={20} />

// Tint a fill icon, stroke an outline icon, or set a uniform color.
<IconView icon="heart" size={24} tint="#FF3366" />
<IconView icon="calendar" size={24} stroke="#3366FF" />

// Raster (png/jpg) icons support resizeMode.
<IconView icon="logo" size={48} resizeMode="contain" />
```

### Props

| Prop             | Type                                | Description                                                        |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------ |
| `icon`           | generated `AppIconType`             | Icon name (autocompleted).                                         |
| `size`           | `number`                            | Square size; sets both width and height.                          |
| `tint`           | `string`                            | Tint color (fill or stroke depending on the icon).               |
| `stroke`         | `string`                            | Stroke color for outline icons.                                   |
| `color`          | `string`                            | Uniform color applied to fill and/or stroke per the icon's type. |
| `resizeMode`     | `ImageResizeMode`                   | For raster icons.                                                 |
| `style`          | `StyleProp<ViewStyle>`              | Style for the icon element.                                       |
| `contentStyle`   | `StyleProp<ViewStyle \| ImageStyle>`| Width/height here are used to size the icon.                      |
| `containerStyle` | `StyleProp<ViewStyle>`              | When set, wraps the icon in a container `View`.                  |
| `testID`         | `string`                            | Forwarded to the icon's host view (as its accessibility label).  |

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
