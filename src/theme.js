import { Platform } from 'react-native';

// Sampled from the client's mockup board: warm cream pages, white cards, deep navy, sand/tan accents.
export const colors = {
  bg: '#FAF1E4',
  surface: '#FFFCF7',
  card: '#FFFFFF',
  border: '#EDE1CF',
  primary: '#0E3F6E',
  primaryDark: '#0A2F54',
  primarySoft: '#E3ECF6',
  tan: '#C2A17E',
  tanSoft: '#F3E8DA',
  sand: '#F1E6D6',
  text: '#14263D',
  muted: '#64707F',
  faint: '#A3ABB5',
  success: '#3F8F6B',
  successSoft: '#E1F0E8',
  danger: '#C0533F',
  dangerSoft: '#F8E3DE',
  star: '#E9A23B',
  white: '#FFFFFF',
};

export const fonts = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' }),
};

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };

export const shadow = { boxShadow: '0px 2px 10px rgba(14, 63, 110, 0.07)' };

export const avatarPalette = ['#C99A74', '#7C9CBF', '#A3B18A', '#D4A5A5', '#9A8CB8', '#E0B872', '#7FB2A8'];
