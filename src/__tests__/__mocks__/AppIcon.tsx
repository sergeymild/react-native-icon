import React from 'react'
import { View } from 'react-native'

export type AppIconType = 'test-icon'

// Intrinsic dims: 40x20 → aspect ratio (w/h) = 2, so aspect math is observable.
export const ICON_META: Record<AppIconType, any> = {
  'test-icon': { kind: 'svg', svgType: 'fill', width: 40, height: 20 },
}

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
