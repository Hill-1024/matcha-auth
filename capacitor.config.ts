import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.matcha.auth',
  appName: 'Matcha Auth',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
