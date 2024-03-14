import * as React from 'react';

import { Image, StyleSheet, View } from 'react-native';
import { IconPath, IconView } from 'react-native-icon';

export default function App() {
  return (
    <View style={styles.container}>
      <IconView icon={'some_icon'} style={styles.box} />
      <IconView icon={'letter'} style={styles.box} />
      <Image source={{ uri: IconPath.cube() }} style={styles.box} />
      {/*<Image source={{ uri: IconPath.letter() }} style={styles.box} />*/}
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
    backgroundColor: 'yellow',
  },
});
