export type PopupType = 'none' | 'scanner' | 'export' | 'actionSheet' | 'deleteConfirm' | 'addModal' | 'editModal' | 'fab';

export type WebDavLaunchSyncDelay = 'never' | '1s' | '10s';
export type WebDavPeriodicSyncInterval = 'off' | 30 | 60;
export type WebDavChangeUploadMode = 'off' | 'full' | 'incremental';
export type WebDavSyncStatus = 'idle' | 'syncing' | 'success' | 'error';

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

export interface WebDavSettings {
  enabled: boolean;
  serverUrl: string;
  username: string;
  password: string;
  remotePath: string;
  launchSyncDelay: WebDavLaunchSyncDelay;
  periodicSyncInterval: WebDavPeriodicSyncInterval;
  changeUploadMode: WebDavChangeUploadMode;
}

export interface WebDavRuntimeState {
  status: WebDavSyncStatus;
  lastSyncAt?: string;
  lastError?: string;
  lastReason?: string;
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
