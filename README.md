# react-native-icon

Convert and place icons in native code

## Installation

```sh
// add to package.json
"react-native-icon":"sergeymild/react-native-icon#0.0.1"
run yarn
```

## Usage

```js
// add this line to package.json in 'scripts' block
// assets=pathToAssets - where all icons is present (usually in the same directory where src folder)
// pathToAssets - must not be placed in src directory to exclude it from build process
"generateIcons": "node node_modules/react-native-icon/scripts/icons/move_to_native.js assets=icons"

// after run `yarn generateIcons`
// script will find all (svg, png, jpg) icons, covert svg to pdf(IOS) vector(Android) and put it to right assets directories
// also it will generate `AppIconType` for autocompletion

import { IconView } from "react-native-icon";

// ...
// params:
// size?: number - if styles is not passed size must be passed otherwise icon will not be generated
// styles?: ViewStyle - if styles passed it also has to include width and height otherwise icon will not be generated
<IconView icon="tomato" size={20}  />
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
