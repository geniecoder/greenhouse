
export interface ThemePalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  chart1: string;
  chart5: string;
  inputBackground: string;
  mutedPanel: string;
}

export const palette: ThemePalette = {
  background: '#f0f4f1',
  foreground: '#1a2e1a',
  card: '#ffffff',
  cardForeground: '#1a2e1a',
  primary: '#2d5f3f',
  primaryForeground: '#ffffff',
  secondary: '#e8f5e9',
  secondaryForeground: '#1a2e1a',
  muted: '#dceadf',
  mutedForeground: '#5a6c5a',
  accent: '#c8e6c9',
  accentForeground: '#1a2e1a',
  border: 'rgba(45, 95, 63, 0.15)',
  destructive: '#c62828',
  destructiveForeground: '#ffffff',
  success: '#4caf50',
  successForeground: '#ffffff',
  warning: '#ff9800',
  warningForeground: '#ffffff',
  info: '#2196f3',
  chart1: '#4caf50',
  chart5: '#ff7043',
  inputBackground: '#f5f9f6',
  mutedPanel: 'rgba(220, 234, 223, 0.55)',
};
