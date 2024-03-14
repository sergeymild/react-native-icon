# react-native-icon

Convert and place icons in native code. 
Do not need anymore use `import('../../icon.{svg|png|jpg}')` to show it in `Image`
Library will move all icons in native folders and generate convinient api to work with them.

Simple:
`<IconView icon="tomato" size={20} />`

## Installation

```sh
// add to package.json
"scripts": {
    "nstallIconsDeps": "cd node_modules/react-native-icon/scripts/icons && yarn",
    
    // assets=pathToAssets - where all icons is present (usually in the same directory where src folder)
    // pathToAssets - must not be placed in src directory to exclude it from build process
    "generateIcons": "node node_modules/react-native-icon/scripts/icons/move_to_native.js assets=icons",
    
    "postinstall": "yarn nstallIconsDeps && yarn generateIcons"
}
"react-native-icon":"sergeymild/react-native-icon#0.0.1"
run yarn
```

## Usage

```js
import { IconView, IconPath } from "react-native-icon";

// ...
// params:
// size?: number - if styles is not passed size must be passed otherwise icon will not be generated
// styles?: ViewStyle - if styles passed it also has to include width and height otherwise icon will not be generated
// tint?: string - color in which to tint icon

// icon - property will have autocomplete with all icon's names
<IconView icon="tomato" size={20}  />

// for all raster icons (jpg, png) library will also generate paths for easily present them in ImageView
<ImageView source={{uri: IconPath.cube()}}  />
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
