import {StyleSheet} from 'react-native';
import {RentAppColors, getRentThemeColors} from '../constants/colors';

export const createThemedStyles = (isDark: boolean) => {
  const themeColors = getRentThemeColors(isDark);

  return StyleSheet.create({
    // Container Styles
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },

    surface: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      shadowColor: RentAppColors.primary[900],
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },

    card: {
      backgroundColor: themeColors.surface,
      borderRadius: 20,
      padding: 20,
      marginHorizontal: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
      shadowColor: RentAppColors.primary[900],
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },

    // Button Styles
    primaryButton: {
      backgroundColor: RentAppColors.primary[500],
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: RentAppColors.primary[900],
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },

    secondaryButton: {
      backgroundColor: RentAppColors.secondary[500],
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: RentAppColors.secondary[900],
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },

    outlineButton: {
      backgroundColor: 'transparent',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: RentAppColors.primary[500],
    },

    // Text Styles
    headingLarge: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.text.primary,
      marginBottom: 8,
    },

    headingMedium: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text.primary,
      marginBottom: 6,
    },

    headingSmall: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text.primary,
      marginBottom: 4,
    },

    bodyLarge: {
      fontSize: 16,
      color: themeColors.text.primary,
      lineHeight: 24,
    },

    bodyMedium: {
      fontSize: 14,
      color: themeColors.text.secondary,
      lineHeight: 20,
    },

    bodySmall: {
      fontSize: 12,
      color: themeColors.text.tertiary,
      lineHeight: 16,
    },

    // Input Styles
    input: {
      backgroundColor: themeColors.surfaceVariant,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      fontSize: 16,
      color: themeColors.text.primary,
      borderWidth: 2,
      borderColor: themeColors.border,
    },

    inputFocused: {
      borderColor: RentAppColors.primary[500],
      backgroundColor: themeColors.surface,
    },

    inputError: {
      borderColor: RentAppColors.status.error,
    },

    // Status Colors
    successContainer: {
      backgroundColor: RentAppColors.secondary[50],
      borderColor: RentAppColors.secondary[200],
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
    },

    warningContainer: {
      backgroundColor: RentAppColors.accent[50],
      borderColor: RentAppColors.accent[200],
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
    },

    errorContainer: {
      backgroundColor: RentAppColors.accent[50],
      borderColor: RentAppColors.accent[200],
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
    },

    // Statistics Cards
    statCard: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 20,
      flex: 1,
      marginHorizontal: 4,
      alignItems: 'center',
      shadowColor: RentAppColors.primary[900],
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },

    primaryStatCard: {
      backgroundColor: RentAppColors.primary[50],
      borderColor: RentAppColors.primary[200],
      borderWidth: 1,
    },

    secondaryStatCard: {
      backgroundColor: RentAppColors.secondary[50],
      borderColor: RentAppColors.secondary[200],
      borderWidth: 1,
    },

    accentStatCard: {
      backgroundColor: RentAppColors.accent[50],
      borderColor: RentAppColors.accent[200],
      borderWidth: 1,
    },
  });
};

// Common gradient styles
export const gradientStyles = {
  primaryGradient: RentAppColors.gradients.primary,
  secondaryGradient: RentAppColors.gradients.secondary,
  accentGradient: RentAppColors.gradients.accent,
  sunsetGradient: RentAppColors.gradients.sunset,
  oceanGradient: RentAppColors.gradients.ocean,
};
