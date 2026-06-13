import {
  ImageResizeMode,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native'
import React from 'react';
import AppIcon, { AppIconType, ICON_META } from './types/AppIcon';
import { resolveIconSize } from './resolveIconSize';

export type { AppIconType };

type IconProps = {
  icon: AppIconType;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle | ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  scaleType?: 'centerCrop' | 'fitCenter';
  /** Square shorthand: sets both width and height. */
  size?: number;
  /** Explicit width. If set without height, height keeps the icon's aspect ratio. */
  width?: number;
  /** Explicit height. If set without width, width keeps the icon's aspect ratio. */
  height?: number;
  tint?: string;
  stroke?: string;
  color?: string;
  scale?: number;
  resizeMode?: ImageResizeMode;
};

export const IconView: React.FC<IconProps> = (props) => {
  const style: StyleProp<ViewStyle> = props.style ?? {};
  const flattenedStyle = StyleSheet.flatten([style, props.contentStyle]) || {};

  // Explicit dimensions: direct props win, then fall back to style width/height.
  const explicitWidth =
    props.width ??
    (typeof flattenedStyle.width === 'number' ? flattenedStyle.width : undefined);
  const explicitHeight =
    props.height ??
    (typeof flattenedStyle.height === 'number' ? flattenedStyle.height : undefined);

  // Intrinsic dimensions drive aspect-ratio sizing when only one side is given.
  const meta = ICON_META[props.icon];
  const { width, height } = resolveIconSize({
    width: explicitWidth,
    height: explicitHeight,
    size: props.size,
    scale: props.scale,
    intrinsicWidth: meta?.width,
    intrinsicHeight: meta?.height,
  });

  const iconStyle: StyleProp<ViewStyle> = [
    style,
    width !== undefined ? { width } : undefined,
    height !== undefined ? { height } : undefined,
  ];

  const iconElement = (
    <AppIcon
      type={props.icon}
      testID={props.testID}
      containerStyle={iconStyle}
      style={props.contentStyle}
      tint={props.tint}
      stroke={props.stroke}
      color={props.color}
      width={width}
      height={height}
      resizeMode={props.resizeMode}
    />
  );

  if (props.containerStyle) {
    return <View style={props.containerStyle}>{iconElement}</View>;
  }

  return iconElement;
};
