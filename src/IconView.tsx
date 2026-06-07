import {
  ImageResizeMode,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native'
import React from 'react';
import AppIcon, { AppIconType } from './types/AppIcon';

export type { AppIconType };

type IconProps = {
  icon: AppIconType;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle | ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  scaleType?: 'centerCrop' | 'fitCenter';
  size?: number;
  tint?: string;
  stroke?: string;
  color?: string;
  scale?: number;
  resizeMode?: ImageResizeMode;
};

export const IconView: React.FC<IconProps> = (props) => {
  let style: StyleProp<ViewStyle> = props.style
  if (!style) style = {}

  const flattenedStyle = StyleSheet.flatten([style, props.contentStyle]) || {}
  const width = flattenedStyle.width || props.size
  const height = flattenedStyle.height || props.size

  const iconStyle: StyleProp<ViewStyle> = [
    style,
    width !== undefined ? {width} : undefined,
    height !== undefined ? {height} : undefined
  ]

  const iconElement = (
    <AppIcon
      type={props.icon}
      containerStyle={iconStyle}
      style={props.contentStyle}
      tint={props.tint}
      stroke={props.stroke}
      color={props.color}
      scale={props.scale}
      width={typeof width === 'number' ? width : undefined}
      height={typeof height === 'number' ? height : undefined}
      size={props.size}
      resizeMode={props.resizeMode}
    />
  )

  if (props.containerStyle) {
    return <View style={props.containerStyle}>{iconElement}</View>
  }

  return iconElement
};
