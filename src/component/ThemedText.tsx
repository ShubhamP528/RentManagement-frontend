import React from 'react';
import {Text, TextProps, TextStyle} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {getRentThemeColors} from '../constants/colors';

interface ThemedTextProps extends TextProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'disabled';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  variant = 'primary',
  size = 'base',
  weight = 'normal',
  style,
  children,
  ...props
}) => {
  const {isDark} = useTheme();
  const themeColors = getRentThemeColors(isDark);

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return themeColors.text.primary;
      case 'secondary':
        return themeColors.text.secondary;
      case 'tertiary':
        return themeColors.text.tertiary;
      case 'disabled':
        return themeColors.text.disabled;
      default:
        return themeColors.text.primary;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'xs':
        return 12;
      case 'sm':
        return 14;
      case 'base':
        return 16;
      case 'lg':
        return 18;
      case 'xl':
        return 20;
      case '2xl':
        return 24;
      case '3xl':
        return 30;
      default:
        return 16;
    }
  };

  const getFontWeight = (): TextStyle['fontWeight'] => {
    switch (weight) {
      case 'normal':
        return '400';
      case 'medium':
        return '500';
      case 'semibold':
        return '600';
      case 'bold':
        return 'bold';
      default:
        return '400';
    }
  };

  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: getFontSize(),
    fontWeight: getFontWeight(),
  };

  return (
    <Text {...props} style={[textStyle, style]}>
      {children}
    </Text>
  );
};
