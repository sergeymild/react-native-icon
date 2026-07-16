# Changelog

## 2.0.1

Убрано поле `packageManager: "yarn@4.13.0"` из `package.json`.

Библиотека подключается как git-зависимость, поэтому в `node_modules`
попадает весь репозиторий целиком — вместе с `package.json`. Когда
проект-потребитель вызывает `yarn` внутри пакета (например,
`cd node_modules/react-native-icon/scripts/icons && yarn`), yarn 1 идёт
вверх по дереву каталогов, первым находит `packageManager` пакета и падает:

```
error This project's package.json defines "packageManager": "yarn@4.13.0".
      However the current global version of Yarn is 1.22.22.
```

Пин нужен был только разработчикам самой библиотеки, но ломал сборку у всех
потребителей не на yarn 4. Теперь версия yarn не навязывается — пакет ставится
любой версией.

## 0.3.0

Эта версия переносит в библиотеку набор изменений, которые раньше жили в
проекте `nova-rn-app` как `patch-package`-патч поверх коммита `629f0ed`
(`patches/react-native-icon+0.2.5.patch`). Теперь всё вшито в исходники ветки
`nwe_` (JS-генератор иконок, без нативного кода), и патч в приложении больше
не нужен.

Затронуты три файла:

- `scripts/icons/combinedGenerator.js` — генератор, который собирает
  `src/types/AppIcon.tsx`;
- `src/IconView.tsx` — публичный компонент-обёртка;
- `src/index.tsx` — точка экспорта.

---

### 1. Имена иконок: `camelCase` → `snake_case` + безопасный префикс

**Файл:** `scripts/icons/combinedGenerator.js`, функция `sanitizeName`.

**Как было:** имя файла лишь очищалось — пробелы и дефисы заменялись на `_`,
спецсимволы удалялись, а если имя начиналось с цифры, добавлялся префикс `_`.
`camelCase` сохранялся как есть.

```js
function sanitizeName(name) {
  return name
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/^(\d)/, '_$1')
}
```

То есть `arrowLeft.svg` превращался в иконку `arrowLeft`, а `2factor.svg` — в
`_2factor`.

**Как стало:** имя сначала переводится из `camelCase` в `snake_case`, а имена,
начинающиеся с цифры, получают префикс `i_` (валидный JS-идентификатор и
совместимость со старыми именами иконок Headway, которые раньше генерировал
`move_to_native.js`).

```js
function camelToSnake(name) {
  return name.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
}

function sanitizeName(name) {
  const sanitized = camelToSnake(name)
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')

  return /^\d/.test(sanitized) ? `i_${sanitized}` : sanitized
}
```

**Результат:**

| Файл | Было | Стало |
| --- | --- | --- |
| `arrowLeft.svg` | `arrowLeft` | `arrow_left` |
| `2factor.svg` | `_2factor` | `i_2factor` |
| `my-icon name.svg` | `my_icon_name` | `my_icon_name` |

> ⚠️ Это ломающее изменение для имён иконок: компоненты теперь нужно вызывать
> по `snake_case`-именам (`icon="arrow_left"` вместо `icon="arrowLeft"`).

---

### 2. Поддержка `resizeMode` для растровых иконок

**Файл:** `scripts/icons/combinedGenerator.js` (свойство уже было добавлено на
ветке `nwe_` отдельным коммитом; в 0.3.0 оно остаётся частью релиза).

**Как было:** растровые `<Image>` всегда рендерились с жёстко заданным
`resizeMode="contain"`.

**Как стало:** в `AppIconProps` добавлен `readonly resizeMode?: ImageResizeMode`,
и значение прокидывается в `<Image>` с дефолтом `contain`:

```tsx
<Image
  source={source}
  style={[{ width, height, tintColor }, style]}
  resizeMode={resizeMode ?? 'contain'}
/>
```

Поведение по умолчанию не меняется, но теперь можно передать `cover`,
`stretch`, `center` и т.д.

---

### 3. Новая логика цвета SVG (`tint` / `color` / `stroke`)

**Файл:** `scripts/icons/combinedGenerator.js`, функция `getSvgIcon`.

**Как было:** `color` имел приоритет только если иконка подходящего типа,
иначе цвет всегда откатывался к `tint` — даже для иконок, которые не должны
заливаться.

```js
const finalFill   = (color && (svgType === 'fill'   || svgType === 'both')) ? color : tint
const finalStroke = (color && (svgType === 'stroke' || svgType === 'both')) ? color : stroke
```

Проблема: для `stroke`-иконки `finalFill` всё равно становился равен `tint`,
что давало нежелательную заливку.

**Как стало:** `color` и `tint` считаются синонимами (`color` приоритетнее),
и цвет применяется только к тому каналу, который реально поддерживает иконка
(по её `svgType`):

```js
const tintColor   = color || tint
const finalFill   = (tintColor && (svgType === 'fill'   || svgType === 'both')) ? tintColor : undefined
const finalStroke = (tintColor && (svgType === 'stroke' || svgType === 'both')) ? (stroke || tintColor) : stroke
```

**Результат:**

- `fill`-иконка заливается `color`/`tint`, обводка не трогается.
- `stroke`-иконка больше **не** получает паразитную заливку — `finalFill`
  остаётся `undefined`; цвет идёт в `stroke`. Явный `stroke` при этом
  приоритетнее, чем `tintColor`.
- `both`-иконка красится `tintColor` и по заливке, и по обводке.

---

### 4. Переписанный `IconView`

**Файл:** `src/IconView.tsx`.

**Как было:** тонкая обёртка, прокидывавшая пропсы в сгенерированный `AppIcon`
без какой-либо обработки размеров и стилей.

```tsx
export const IconView: React.FC<IconProps> = (props) => {
  return <AppIcon {...props} type={props.icon} />;
};
```

Доступные пропсы: `icon`, `style`, `containerStyle`, `scaleType`, `size`,
`tint`, `scale`.

**Как стало:** добавлены пропсы `contentStyle`, `stroke`, `color`,
`resizeMode`; размеры теперь вычисляются из стилей/`size` и разносятся по
контейнеру и содержимому:

- `style` + `contentStyle` «сплющиваются» через `StyleSheet.flatten`, из них
  (или из `size`) берутся `width`/`height`;
- `style` вместе с вычисленными `width`/`height` уходит в `containerStyle`
  компонента `AppIcon` (внешний контейнер иконки);
- `contentStyle` уходит в `style` (стиль самого SVG/`<Image>`);
- `tint`, `stroke`, `color`, `scale`, `resizeMode`, числовые `width`/`height`
  и `size` прокидываются явно;
- если задан `containerStyle`, иконка дополнительно оборачивается во внешний
  `<View style={containerStyle}>`.

```tsx
type IconProps = {
  icon: AppIconType;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle | ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  scaleType?: 'centerCrop' | 'fitCenter';
  size?: number;
  tint?: string;
  stroke?: string;
  color?: string;
  scale?: number;
  resizeMode?: ImageResizeMode;
};
```

**Зачем:** появляется разделение «контейнер / содержимое» — внешние отступы,
позиционирование и фон задаются через `style`/`containerStyle`, а внешний вид
самого изображения — через `contentStyle`; плюс прямой доступ к `stroke`,
`color` и `resizeMode`.

---

### 5. Корректные type-only экспорты

**Файл:** `src/index.tsx`.

Тип `AppIconType` теперь экспортируется через `export type`, что требуется при
`isolatedModules` и предотвращает попадание типа в рантайм-бандл.

```tsx
// было
export { IconView, AppIconType } from './IconView';

// стало
export {IconView} from './IconView'
export type {AppIconType} from './IconView'
```

(Аналогичная правка сделана и в `src/IconView.tsx`: `export { AppIconType }`
→ `export type { AppIconType }`.)

---

### Миграция в приложении

В `nova-rn-app` патч `patches/react-native-icon+0.2.5.patch` удалён, а
зависимость переведена на релиз 0.3.0. Если где-то иконки вызывались по
`camelCase`-именам — их нужно перевести на `snake_case` (см. пункт 1).
