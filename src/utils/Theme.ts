export const Theme = {
  colors: {
    background: '#F2F2F7',
    card: '#FFFFFF',
    primary: '#10b981', // Keeping the green but could use Apple's #34C759
    text: '#000000',
    secondaryText: '#8E8E93',
    separator: '#C6C6C8',
    white: '#FFFFFF',
    blue: '#007AFF',
    orange: '#FF9500',
    red: '#FF3B30',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 32,
    full: 9999,
  },
  shadows: {
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
  }
};
