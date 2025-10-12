/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./src/**/*.{js,jsx,ts,tsx}', './App.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Modern Rent Management Colors
        primary: {
          50: '#F6F8FF',
          100: '#E6ECFE',
          200: '#BED2FD',
          300: '#99B8F2',
          400: '#5B7FFB',
          500: '#346AE3', // Key blue
          600: '#2551BE',
          700: '#1A3996',
          800: '#182F72',
          900: '#151F49',
        },
        secondary: {
          50: '#EEFCF7',
          100: '#D5F7ED',
          200: '#9BEAD8',
          300: '#61D3B5',
          400: '#38BC99',
          500: '#169979', // Strong teal
          600: '#137C63',
          700: '#0B6050',
          800: '#085244',
          900: '#063B33',
        },
        accent: {
          50: '#FFF7F3',
          100: '#FFE3DC',
          200: '#FFD0BE',
          300: '#FFA982',
          400: '#FF8662',
          500: '#FF704D', // Main coral
          600: '#D85A3E',
          700: '#B14030',
          800: '#933428',
          900: '#70201B',
        },
        // Override default grays with our theme colors
        gray: {
          50: '#F9FAFB', // Light background
          100: '#F3F4F8', // Surface variant
          200: '#E5E7EB', // Border
          300: '#C0C5D1', // Disabled text
          400: '#8C92A4', // Tertiary text
          500: '#5B5B6A', // Secondary text
          600: '#222C3A', // Primary text
          700: '#263140', // Dark surface variant
          800: '#202C3B', // Dark surface
          900: '#151F2B', // Dark background
        },
        // Status colors
        green: {
          50: '#EEFCF7',
          100: '#D5F7ED',
          200: '#9BEAD8',
          300: '#61D3B5',
          400: '#38BC99',
          500: '#169979', // Success
          600: '#137C63',
          700: '#0B6050',
          800: '#085244',
          900: '#063B33',
        },
        blue: {
          50: '#F6F8FF',
          100: '#E6ECFE',
          200: '#BED2FD',
          300: '#99B8F2',
          400: '#5B7FFB',
          500: '#346AE3', // Info
          600: '#2551BE',
          700: '#1A3996',
          800: '#182F72',
          900: '#151F49',
        },
        yellow: {
          50: '#FFF7F3',
          100: '#FFE3DC',
          200: '#FFD0BE',
          300: '#FFA982',
          400: '#FF8662',
          500: '#FF704D', // Warning
          600: '#D85A3E',
          700: '#B14030',
          800: '#933428',
          900: '#70201B',
        },
        red: {
          50: '#FFF7F3',
          100: '#FFE3DC',
          200: '#FFD0BE',
          300: '#FFA982',
          400: '#FF8662',
          500: '#F14A4A', // Error
          600: '#D85A3E',
          700: '#B14030',
          800: '#933428',
          900: '#70201B',
        },
      },
    },
  },
  plugins: [],
};
