import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import { IconView } from 'react-native-icon';

export default function App() {
  return (
    <View style={styles.container}>
      <IconView icon={'some_icon'} size={60} testID="icon-some_icon" />
      <IconView icon={'letter'} size={60} tint="#3366FF" testID="icon-letter" />
      <IconView
        icon={'ic_calendar'}
        size={60}
        stroke="#E0245E"
        testID="icon-ic_calendar"
      />
      <IconView
        icon={'cube'}
        size={60}
        resizeMode="contain"
        testID="icon-cube"
      />
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
