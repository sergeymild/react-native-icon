import {
  requireNativeComponent,
  UIManager,
  Platform,
  ViewStyle,
  processColor,
} from 'react-native';
import React from 'react';
import type { AppIconType } from './types';

const LINKING_ERROR =
  `The package 'react-native-icon' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

type IconProps = {
  icon: AppIconType;
  style?: ViewStyle;
  tint?: string;
};

const ComponentName = 'IconView';

export const _IconView =
  UIManager.getViewManagerConfig(ComponentName) != null
    ? requireNativeComponent<IconProps>(ComponentName)
    : () => {
        throw new Error(LINKING_ERROR);
      };

export const IconView: React.FC<IconProps> = (props) => {
  return (
    <_IconView
      icon={props.icon}
      style={props.style}
      //@ts-ignore
      tint={props.tint ? processColor(props.tint) : undefined}
    />
  );
};
