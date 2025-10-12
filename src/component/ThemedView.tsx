import React from 'react';
import {View, ViewProps} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';

interface ThemedViewProps extends ViewProps {
  children: React.ReactNode;
}

export const ThemedView: React.FC<ThemedViewProps> = ({
  children,
  style,
  className,
  ...props
}) => {
  const {isDark} = useTheme();

  // Combine the dark class with existing className
  const combinedClassName = isDark
    ? `dark ${className || ''}`.trim()
    : className || '';

  return (
    <View {...props} className={combinedClassName} style={style}>
      {children}
    </View>
  );
};
