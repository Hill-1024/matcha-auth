import { registerPlugin } from '@capacitor/core';

export interface TonalPalette {
  0: string;
  10: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  1000: string;
}

export interface MonetPalette {
  accent1: TonalPalette;
  accent2: TonalPalette;
  accent3: TonalPalette;
  neutral1: TonalPalette;
  neutral2: TonalPalette;
}

export interface MonetColorPlugin {
  getColors(): Promise<MonetPalette>;
}

const MonetColor = registerPlugin<MonetColorPlugin>('MonetColor');

export const getMonetColors = async (): Promise<MonetPalette | null> => {
  try {
    const palette = await MonetColor.getColors();
    return palette;
  } catch (error) {
    console.warn('Monet colors not available:', error);
    return null;
  }
};
