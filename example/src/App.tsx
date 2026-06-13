import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import { IconView } from 'react-native-icon';

export default function App() {
  return (
    <View style={styles.container}>
      {/* Each icon is wrapped in a testID'd View so Detox can match it via
          by.id (RN maps a View's testID to the iOS accessibilityIdentifier). */}
      <View testID="icon-some_icon">
        <IconView icon={'some_icon'} size={60} />
      </View>
      <View testID="icon-letter">
        {/* stroke icon → recolor via stroke */}
        <IconView icon={'letter'} size={60} stroke="#3366FF" />
      </View>
      <View testID="icon-ic_calendar">
        {/* fill icon → recolor via tint (single color) */}
        <IconView icon={'ic_calendar'} size={60} tint="#E0245E" />
      </View>
      <View testID="icon-cube">
        <IconView icon={'cube'} size={60} resizeMode="contain" />
      </View>

      {/* Aspect-ratio sizing. wide_pill is 48x16 (3:1). */}
      {/* width only → height auto-derives to keep 3:1 (120 → 40). */}
      <View testID="icon-pill-width">
        <IconView icon={'wide_pill'} width={120} tint="#1A1A1A" />
      </View>
      {/* height only → width auto-derives to keep 3:1 (16 → 48). */}
      <View testID="icon-pill-height">
        <IconView icon={'wide_pill'} height={16} tint="#888888" />
      </View>
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
