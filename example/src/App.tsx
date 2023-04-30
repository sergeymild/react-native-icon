import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import { IconView } from 'react-native-icon';

export default function App() {
  return (
    <View style={styles.container}>
      <IconView icon={'Icon_check'} style={styles.box} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
    backgroundColor: 'yellow'
  },
});
