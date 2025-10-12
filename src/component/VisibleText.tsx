import React from 'react';
import {Text, TextProps} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {getRentThemeColors} from '../constants/colors';

interface VisibleTextProps extends TextProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  forceColor?: string;
}

export const VisibleText: React.FC<VisibleTextProps> = ({
  children,
  variant = 'primary',
  forceColor,
  style,
  ...props
}) => {
  const {isDark} = useTheme();
  const themeColors = getRentThemeColors(isDark);

  const getTextColor = () => {
    if (forceColor) return forceColor;

    switch (variant) {
      case 'primary':
        return isDark ? '#F4F6FB' : '#222C3A';
      case 'secondary':
        return isDark ? '#D2D6E3' : '#5B5B6A';
      case 'tertiary':
        return isDark ? '#A2ADC6' : '#8C92A4';
      default:
        return isDark ? '#F4F6FB' : '#222C3A';
    }
  };

  return (
    <Text
      {...props}
      style={[
        {
          color: getTextColor(),
        },
        style,
      ]}>
      {children}
    </Text>
  );
};
