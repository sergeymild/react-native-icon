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
        <IconView icon={'letter'} size={60} tint="#3366FF" />
      </View>
      <View testID="icon-ic_calendar">
        <IconView icon={'ic_calendar'} size={60} stroke="#E0245E" />
      </View>
      <View testID="icon-cube">
        <IconView icon={'cube'} size={60} resizeMode="contain" />
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
