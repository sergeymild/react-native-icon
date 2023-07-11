import {
  requireNativeComponent,
  UIManager,
  Platform,
  ViewStyle,
  processColor,
  StyleProp,
  StyleSheet,
  View,
} from 'react-native';
import React from 'react';
import type { AppIconType } from './types';
import { IconSize } from './types';
export { AppIconType };

const LINKING_ERROR =
  `The package 'react-native-icon' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

type IconProps = {
  icon: AppIconType;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  scaleType?: 'centerCrop' | 'fitCenter';
  size?: number;
  tint?: string;
  scale?: number;
};

const ComponentName = 'IconView';

export const _IconView =
  UIManager.getViewManagerConfig(ComponentName) != null
    ? requireNativeComponent<IconProps>(ComponentName)
    : () => {
        throw new Error(LINKING_ERROR);
      };

export const IconView: React.FC<IconProps> = (props) => {
  let style: StyleProp<ViewStyle> = props.style;
  if (!style) style = {};
  style = StyleSheet.flatten(style);
  const width =
    style.width ||
    props.size ||
    IconSize[props.icon].width / (props.scale ?? 1);
  const height =
    style.height ||
    props.size ||
    IconSize[props.icon].height / (props.scale ?? 1);

  const IconComponent = (
    <_IconView
      icon={props.icon}
      scaleType={props.scaleType}
      style={[style, { width, height }]}
      //@ts-ignore
      tint={props.tint ? processColor(props.tint) : undefined}
    />
  );

  if (props.containerStyle) {
    return <View children={IconComponent} style={props.containerStyle} />;
  }

  return IconComponent;
};
