import { Platform } from 'react-native';

export const colors = {
  bg: '#F6EFE4',
  surface: '#FFFBF5',
  card: '#FFFFFF',
  border: '#EADFCF',
  primary: '#1E4A7A',
  primaryDark: '#163A61',
  primarySoft: '#E3EBF4',
  tan: '#B98B5E',
  tanSoft: '#F1E4D3',
  text: '#1B2B3F',
  muted: '#6B7684',
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

export const shadow = { boxShadow: '0px 2px 10px rgba(30, 74, 122, 0.08)' };

export const avatarPalette = ['#C99A74', '#7C9CBF', '#A3B18A', '#D4A5A5', '#9A8CB8', '#E0B872', '#7FB2A8'];
