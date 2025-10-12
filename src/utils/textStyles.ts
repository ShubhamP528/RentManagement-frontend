import {TextStyle} from 'react-native';
import {getRentThemeColors} from '../constants/colors';

export const getVisibleTextStyle = (
  isDark: boolean,
  variant: 'primary' | 'secondary' | 'tertiary' = 'primary',
  size: number = 16,
  weight: TextStyle['fontWeight'] = '400',
): TextStyle => {
  const themeColors = getRentThemeColors(isDark);

  let color: string;
  switch (variant) {
    case 'primary':
      color = themeColors.text.primary;
      break;
    case 'secondary':
      color = themeColors.text.secondary;
      break;
    case 'tertiary':
      color = themeColors.text.tertiary;
      break;
    default:
      color = themeColors.text.primary;
  }

  return {
    color,
    fontSize: size,
    fontWeight: weight,
  };
};
