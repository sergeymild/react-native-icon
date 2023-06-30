import {
  requireNativeComponent,
  UIManager,
  Platform,
  ViewStyle,
  processColor,
  StyleProp,
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
  scaleType?: 'centerCrop' | 'fitCenter';
  size?: number;
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
  let style: StyleProp<ViewStyle> = props.style;
  if (!style)
    style = {
      width: props.size ?? IconSize[props.icon].width,
      height: props.size ?? IconSize[props.icon].height,
    };

  return (
    <_IconView
      icon={props.icon}
      scaleType={props.scaleType}
      style={style}
      //@ts-ignore
      tint={props.tint ? processColor(props.tint) : undefined}
    />
  );
};
