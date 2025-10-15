import React from 'react';
import {View, Text, TouchableOpacity, StatusBar, Platform} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {RentAppColors, getRentThemeColors} from '../constants/colors';
import {useTheme} from '../contexts/ThemeContext';
import {ThemeToggle} from './ThemeToggle';

interface CustomHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onBackPress?: () => void;
  onHomePress?: () => void;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  subtitle = 'Viewing',
  showBackButton = true,
  showHomeButton = true,
  onBackPress,
  onHomePress,
}) => {
  const navigation = useNavigation();
  const {isDark} = useTheme();
  const themeColors = getRentThemeColors(isDark);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleHomePress = () => {
    if (onHomePress) {
      onHomePress();
    } else {
      navigation.navigate('Properties' as never);
    }
  };

  // Get status bar height
  const statusBarHeight =
    Platform.OS === 'ios' ? 40 : StatusBar.currentHeight || 20;

  return (
    <View
      style={{
        backgroundColor: themeColors.surface,
        borderBottomColor: themeColors.border,
        borderBottomWidth: 1,
        paddingTop: statusBarHeight + 2,
        paddingHorizontal: 16,
        paddingBottom: 8,
      }}>
      <StatusBar
        backgroundColor={themeColors.surface}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        {/* Back Button */}
        {showBackButton ? (
          <TouchableOpacity
            onPress={handleBackPress}
            style={{
              width: 48,
              height: 48,
              backgroundColor: themeColors.surfaceVariant,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: RentAppColors.primary[900],
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}>
            <Icon
              name="arrow-left"
              size={24}
              color={themeColors.text.primary}
            />
          </TouchableOpacity>
        ) : (
          <View style={{width: 48, height: 48}} />
        )}

        {/* Title Section */}
        <View style={{flex: 1, alignItems: 'center'}}>
          <Text
            style={{
              color: themeColors.text.secondary,
              fontSize: 14,
              fontWeight: '500',
            }}>
            {subtitle}
          </Text>
          <Text
            style={{
              color: themeColors.text.primary,
              fontSize: 20,
              fontWeight: 'bold',
              marginTop: 2,
            }}>
            {title}
          </Text>
        </View>

        {/* Right Side Actions */}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          {/* Theme Toggle */}
          <ThemeToggle size="medium" />

          {/* Home Button */}
          {showHomeButton ? (
            <TouchableOpacity
              onPress={handleHomePress}
              style={{
                width: 44,
                height: 44,
                backgroundColor: RentAppColors.primary[500],
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: RentAppColors.primary[900],
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}>
              <Icon name="home" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default CustomHeader;
