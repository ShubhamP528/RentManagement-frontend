// Modern Rent Management Colors
export const RentAppColors = {
  // Brand Primary Colors: contemporary blue shades for trust & calm
  primary: {
    50: '#F6F8FF', // Ultra-light blue
    100: '#E6ECFE', // Light blue
    200: '#BED2FD', // Soft blue
    300: '#99B8F2', // Sky blue
    400: '#5B7FFB', // Brand blue
    500: '#346AE3', // Key blue
    600: '#2551BE', // Deep blue
    700: '#1A3996', // Blue navy
    800: '#182F72', // Indigo blue
    900: '#151F49', // Almost black-blue
  },

  // Financial Secondary: modern teal-green for positive actions
  secondary: {
    50: '#EEFCF7', // Mint highlight
    100: '#D5F7ED', // Soft mint
    200: '#9BEAD8', // Fresh teal
    300: '#61D3B5', // Light teal
    400: '#38BC99', // Medium teal
    500: '#169979', // Strong teal
    600: '#137C63', // Deep teal
    700: '#0B6050', // Emerald
    800: '#085244', // Rich emerald
    900: '#063B33', // Green-black
  },

  // Accent: up-to-date coral to energize highlights
  accent: {
    50: '#FFF7F3', // Ultra-light coral
    100: '#FFE3DC', // Light coral
    200: '#FFD0BE', // Dawn coral
    300: '#FFA982', // Bright coral
    400: '#FF8662', // Vibrant coral
    500: '#FF704D', // Main accent coral
    600: '#D85A3E', // Deep coral
    700: '#B14030', // Rust accent
    800: '#933428', // Old rose
    900: '#70201B', // Red-brown
  },

  // Status Feedback (Success, Info, Warning, Error)
  status: {
    success: '#169979', // Modern teal
    warning: '#FF8662', // Vibrant coral accent
    error: '#F14A4A', // Contemporary red
    info: '#346AE3', // Brand blue
  },

  // Neutral (Light Theme): clean, spacious
  light: {
    background: '#F9FAFB', // App background
    surface: '#FFFFFF', // Card surfaces
    surfaceVariant: '#F3F4F8', // Alternative background
    border: '#E5E7EB', // Borders
    divider: '#E9ECEF', // Dividers
    text: {
      primary: '#222C3A', // Main text
      secondary: '#5B5B6A', // Secondary text
      tertiary: '#8C92A4', // Tertiary text
      disabled: '#C0C5D1', // Disabled text
    },
  },

  // Neutral (Dark Theme): for night mode and low light
  dark: {
    background: '#151F2B', // App background
    surface: '#202C3B', // Card surfaces
    surfaceVariant: '#263140', // Alt surface
    border: '#303D51', // Borders
    divider: '#38475A', // Dividers
    text: {
      primary: '#F4F6FB', // Main text
      secondary: '#D2D6E3', // Secondary text
      tertiary: '#A2ADC6', // Tertiary text
      disabled: '#6D7891', // Disabled text
    },
  },

  // Gradient Presets
  gradients: {
    primary: ['#346AE3', '#1A3996'],
    secondary: ['#169979', '#137C63'],
    accent: ['#FF8662', '#D85A3E'],
    ocean: ['#346AE3', '#169979'],
    sunset: ['#FF8662', '#F14A4A'],
  },
};

// Theme-aware color pick helper
export const getRentThemeColors = (isDark: boolean) => ({
  background: isDark
    ? RentAppColors.dark.background
    : RentAppColors.light.background,
  surface: isDark ? RentAppColors.dark.surface : RentAppColors.light.surface,
  surfaceVariant: isDark
    ? RentAppColors.dark.surfaceVariant
    : RentAppColors.light.surfaceVariant,
  border: isDark ? RentAppColors.dark.border : RentAppColors.light.border,
  divider: isDark ? RentAppColors.dark.divider : RentAppColors.light.divider,
  text: isDark ? RentAppColors.dark.text : RentAppColors.light.text,
  primary: RentAppColors.primary[500],
  secondary: RentAppColors.secondary[500],
  accent: RentAppColors.accent[500],
  status: RentAppColors.status,
});

// Legacy exports for backward compatibility
export const Colors = RentAppColors;
export const getThemeColors = getRentThemeColors;
