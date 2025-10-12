import React from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '../contexts/ThemeContext';
import {RentAppColors, getRentThemeColors} from '../constants/colors';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'medium',
  showLabel = false,
}) => {
  const {themeMode, isDark, toggleTheme} = useTheme();
  const themeColors = getRentThemeColors(isDark);

  const getIconName = () => {
    switch (themeMode) {
      case 'light':
        return 'white-balance-sunny';
      case 'dark':
        return 'moon-waning-crescent';
      default:
        return 'white-balance-sunny';
    }
  };

  const getLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'Light';
    }
  };

  const getSizes = () => {
    switch (size) {
      case 'small':
        return {container: 32, icon: 16, text: 10};
      case 'large':
        return {container: 56, icon: 28, text: 14};
      default:
        return {container: 44, icon: 22, text: 12};
    }
  };

  const sizes = getSizes();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={{
        width: sizes.container,
        height: sizes.container,
        backgroundColor: themeColors.surfaceVariant,
        borderRadius: sizes.container / 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: RentAppColors.primary[900],
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
      <Icon
        name={getIconName()}
        size={sizes.icon}
        color={themeColors.text.primary}
      />
      {showLabel && (
        <Text
          style={{
            color: themeColors.text.secondary,
            fontSize: sizes.text,
            marginTop: 2,
            fontWeight: '500',
          }}>
          {getLabel()}
        </Text>
      )}
    </TouchableOpacity>
  );
};
