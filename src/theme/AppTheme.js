import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Brand Colors
  primary: '#1A237E',      // Deep Indigo
  primaryLight: '#534BAE', // Soft Indigo
  primaryDark: '#000051',  // Midnight Blue
  
  secondary: '#2C3E50',    // Slate Blue
  accent: '#00D2FF',       // Cyber Neon Blue
  accentRose: '#FF0072',   // Vibrant Rose
  accentGold: '#FFB300',   // Amber Gold
  
  // Neutral Colors
  background: '#F5F7FA',   // Soft Off-White
  surface: '#FFFFFF',      // Pure White
  surfaceDark: '#1E1E2C',  // Dark Surface
  
  // Text Colors
  text: '#212121',         // Dark Gray
  textLight: '#757575',    // Medium Gray
  textMuted: '#BDBDBD',    // Soft Gray
  textWhite: '#FFFFFF',    // White
  
  // Semantic Colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#2196F3',
  
  // Gradients
  gradientPrimary: ['#1A237E', '#3D5AFE'],
  gradientAccent: ['#00D2FF', '#3A7BD5'],
  gradientSuccess: ['#43A047', '#1B5E20'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 24,
  xl: 32,
  xxl: 50,
};

export const SHADOW = {
  light: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: "#1A237E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  premium: {
    shadowColor: "#00D2FF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 12,
  }
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  h2: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    fontWeight: '500',
  },
  caption: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  }
};

export default { COLORS, SPACING, RADIUS, SHADOW, TYPOGRAPHY, width, height };
