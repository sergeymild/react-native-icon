import { StyleProp, ViewStyle } from 'react-native';
import React from 'react';
import AppIcon, { AppIconType } from './types/AppIcon';

export { AppIconType };

type IconProps = {
  icon: AppIconType;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  scaleType?: 'centerCrop' | 'fitCenter';
  size?: number;
  tint?: string;
  scale?: number;
};

export const IconView: React.FC<IconProps> = (props) => {
  return <AppIcon {...props} type={props.icon} />;
};
