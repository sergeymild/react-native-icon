# Дизайн: чистка натива + тесты + починка example

**Дата:** 2026-06-12
**Ветка:** `nwe_`
**Статус:** одобрено пользователем, готово к плану реализации

## Контекст

Ветка `nwe_` переписала пайплайн генерации иконок: вместо нативного `IconView`
(нативный `RCTViewManager` на iOS + `IconViewManager`/`IconPackage` на Android,
рендеривший иконки из bundled-ассетов) библиотека теперь генерирует чистый
React-компонент `AppIcon.tsx`, который импортирует `.svg` как
`react-native-svg`-компоненты (`import Cube from './cube.svg'`).

JS-сторона больше **не обращается** к нативному компоненту: в `src/` нет ни
`requireNativeComponent`, ни `getViewManagerConfig`. Поэтому весь нативный код
стал мёртвым.

Дополнительно при разборе обнаружено, что новая архитектура **не доведена до
рабочего состояния**:

| Что | Состояние на момент дизайна |
|---|---|
| `peerDependencies` либы | нет `react-native-svg` |
| `example/package.json` deps | нет `react-native-svg`, нет svg-transformer |
| `example/metro.config.js` | нет svg-transformer (metro вернёт asset, а не компонент) |
| `example/src/App.tsx` | импортирует `{ IconPath, IconView }` со старым API — `IconPath` больше не экспортируется, не компилируется |
| `example/package.json → generateIcons` | указывает на удалённый `move_to_native.js` |
| Тесты | отсутствуют полностью |

## Цель

Привести библиотеку к консистентному состоянию «чистый JS поверх
`react-native-svg`»: удалить мёртвый натив, сделать зависимости корректными,
починить example-приложение и покрыть тестами (unit ядра SVG-обработки + render
компонентов + Detox e2e).

## Фаза 1 — Удаление натива

Удалить целиком:
- `android/` (вся папка: `IconPackage.java`, `IconViewManager.java`,
  `build.gradle`, `gradle.properties`, `AndroidManifest.xml`, `res/drawable*`)
- `ios/` (вся папка: `IconViewManager.m`, `Icon.xcodeproj`, `IconImages.xcassets/*`)
- `react-native-icon.podspec`

Правки `package.json`:
- `files`: убрать `"android"`, `"ios"`, `"cpp"`, `"*.podspec"` и связанные
  `!ios/build`, `!android/*` исключения
- `scripts.clean`: убрать `android/build`, оставить только example-сборки
- `devDependencies`: убрать `pod-install` (натив больше не собирается на уровне либы)
- `keywords`: оставить как есть (косметика)
- `"react-native": "src/index"` — **оставить** (это metro entry point, не натив)

## Фаза 2 — Корректность либы

- В `peerDependencies` добавить `"react-native-svg": "*"` (генерируемый `AppIcon`
  рендерит `.svg` как RN-SVG компоненты).
- Проверить экспорты `src/index.tsx` / `src/IconView.tsx`: публичный API =
  `IconView` + `AppIconType`.

## Фаза 3 — Рефактор `svgProcessor` + unit-тесты

Разделить файловый I/O и чистую логику:

```js
// чистая, тестируемая
function processSvgContent(content) -> { content, type, modified }
// тонкая обёртка над fs (поведение не меняется)
function processSvgFile(filePath) { read -> processSvgContent -> write }
```

**Страховка:** перед рефактором снять golden-снапшот текущего вывода
`processSvgFile` на реальных `example/src/icons/*.svg`, чтобы рефактор гарантированно
не менял поведение.

Unit-кейсы (jest, node-окружение, без RN):
- hoisting `fill`/`stroke` из child-элементов в `<svg>` root
- детект типа: `fill` / `stroke` / `both` (включая явные `fill="none"` /
  `stroke="none"` на root)
- stroke-иконки получают `fill="none"`, дочерние — `stroke="none"` где нужно
- `both`: корректная раздача `none`-атрибутов, обработка self-closing тегов
- исключения `fill-opacity` / `stroke-opacity` (значения не удаляются)
- удаление `<filter>`, пустых `<defs>`, `filter="..."`; сохранение
  `clipPath` / градиентов
- escape спецсимволов в значениях цвета
- идемпотентность: повторный прогон не меняет уже обработанный SVG

## Фаза 4 — Починка example-приложения

- `example/package.json`: добавить `react-native-svg`,
  `react-native-svg-transformer` (dev); `generateIcons` →
  `node ../scripts/icons/generate.js .` (новый CLI вместо удалённого
  `move_to_native.js`)
- `example/metro.config.js`: подключить svg-transformer (`babelTransformerPath`,
  `sourceExts += svg`, `assetExts -= svg`)
- `example/src/App.tsx`: переписать под новый API (`IconView icon={...}` с типами
  из сгенерированного `AppIcon`)
- регенерация иконок в `example/src/types/AppIcon.tsx`
- iOS: `pod install` (подтянет `react-native-svg`); проверить сборку и запуск на
  симуляторе
- `react-native-svg` версия — совместимая с RN 0.75.4

## Фаза 5 — Render-тесты (компоненты)

- Jest: preset `react-native`, `@testing-library/react-native`, маппинг `.svg` в
  тестах (мок-компонент через `moduleNameMapper` / transform)
- Тесты `IconView`: проброс `size` / `tint` / `stroke` / `color` / `resizeMode` /
  `isVisible`, логика `containerStyle` / `contentStyle`, расчёт width/height;
  снапшот React-дерева на фикстуре-иконке

## Фаза 6 — Detox e2e

- Detox + конфиг (iOS-симулятор), `jest-circus` раннер для e2e
- Сборка example-приложения; e2e-тест: экран с несколькими иконками
  (fill / stroke / both / tinted), проверка присутствия по `testID` + опционально
  скриншот-снапшот
- e2e гоняется отдельным скриптом, не в основном `yarn test`

## Стратегия тестов / структура

- `yarn test` (jest) = unit + render (быстро, без симулятора)
- `yarn e2e` = Detox (отдельно, тяжело)
- Jest projects или раздельные конфиги, чтобы node-окружение svgProcessor не
  конфликтовало с RN-окружением render-тестов

## Риски / открытые места

- `svgProcessor` основан на регекспах — рефактор делаем строго без изменения
  поведения; golden-тесты на текущих `example/src/icons/*.svg` фиксируют текущий
  вывод до рефактора
- Detox на iOS требует рабочей нативной сборки example — самый хрупкий пункт; если
  упрёмся в окружение, e2e оформим, но прогон может потребовать машины/симулятора
  пользователя
- `react-native-svg` версия должна быть совместима с RN 0.75.4

## Решения, зафиксированные с пользователем

- Натив удаляем **целиком** (папки `android/`, `ios/`, podspec).
- Тесты: **unit + render + полный Detox e2e**.
- Example-приложение **приводим в полный порядок** (включая нативную сборку и
  запуск на симуляторе).
- `yarn test` и `yarn e2e` **разнесены**.
- Golden-снапшот вывода `svgProcessor` снимаем **до** рефактора как страховку.
