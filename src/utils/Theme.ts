import { useColorScheme } from 'react-native';
import { useStore } from '../store/useStore';

export const lightColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#000000',
  accent: '#10b981',
  text: '#000000',
  secondaryText: '#6C757D',
  separator: '#E9ECEF',
  white: '#FFFFFF',
  blue: '#007AFF',
  orange: '#FF9500',
  red: '#FF3B30',
};

export const darkColors = {
  background: '#000000',
  card: '#121212',
  primary: '#FFFFFF',
  accent: '#10b981',
  text: '#FFFFFF',
  secondaryText: '#A0A0A0',
  separator: '#2C2C2E',
  white: '#FFFFFF',
  blue: '#0A84FF',
  orange: '#FF9F0A',
  red: '#FF453A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
};

export const useAppTheme = () => {
  const scheme = useColorScheme();
  const themePreference = useStore(state => state.themePreference);
  
  const isDark = themePreference === 'system' 
    ? scheme === 'dark' 
    : themePreference === 'dark';

  return {
    colors: isDark ? darkColors : lightColors,
    spacing,
    radius,
    shadows,
    isDark,
  };
};
