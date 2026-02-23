export type PopupType = 'none' | 'scanner' | 'export' | 'actionSheet' | 'deleteConfirm' | 'addModal' | 'fab';

export interface Token {
  id: string;
  issuer: string;
  account: string;
  secret: string; // The base32 secret key
  code: string;
  icon?: string; // URL or Material Symbol name
  color?: string; // Brand color
  period: number; // usually 30
  remaining: number; // simulated seconds remaining
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  tertiaryContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
}