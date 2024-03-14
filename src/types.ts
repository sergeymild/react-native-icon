import {Platform} from 'react-native';

export type AppIconType = 'cube' | 'letter' | 'some_icon'
export const IconSize = {
		cube: {width: 72, height: 72},
		letter: {width: 24, height: 24},
		some_icon: {width: 40, height: 41}
}
export const IconPath = {
		cube: () => Platform.OS === 'ios' ? 'IconAssets.bundle/cube' : 'cube'
}