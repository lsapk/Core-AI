import { useColorScheme } from 'react-native';
import { useStore } from '../store/useStore';

export const lightColors = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  primary: '#10b981',
  text: '#000000',
  secondaryText: '#8E8E93',
  separator: '#C6C6C8',
  white: '#FFFFFF',
  blue: '#007AFF',
  orange: '#FF9500',
  red: '#FF3B30',
};

export const darkColors = {
  background: '#000000',
  card: '#1C1C1E',
  primary: '#10b981',
  text: '#FFFFFF',
  secondaryText: '#8E8E93',
  separator: '#38383A',
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
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 32,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
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
