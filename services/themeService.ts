import { RGB, ThemeColors } from "../types";
import { MonetPalette } from "./monetService";

// Helper: Convert Hex to RGB
export const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : { r: 0, g: 0, b: 0 };
};

// Helper: Convert RGB to Hex
export const rgbToHex = ({ r, g, b }: RGB): string => {
  return (
      "#" +
      ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  );
};

// Helper: Lighten/Darken color (Quick Simulation of Tonal Palettes)
const shiftColor = (rgb: RGB, percent: number): string => {
  const { r, g, b } = rgb;
  const amt = Math.round(2.55 * percent);
  const R = (r + amt) < 0 ? 0 : (r + amt) > 255 ? 255 : (r + amt);
  const G = (g + amt) < 0 ? 0 : (g + amt) > 255 ? 255 : (g + amt);
  const B = (b + amt) < 0 ? 0 : (b + amt) > 255 ? 255 : (b + amt);
  return rgbToHex({ r: Math.round(R), g: Math.round(G), b: Math.round(B) });
};

// Helper: Mix color with white/black to simulate opacity/containers
const mix = (color: RGB, mixColor: RGB, weight: number): string => {
  const w = weight / 100;
  const w2 = 1 - w;
  const r = Math.round(color.r * w2 + mixColor.r * w);
  const g = Math.round(color.g * w2 + mixColor.g * w);
  const b = Math.round(color.b * w2 + mixColor.b * w);
  return rgbToHex({ r, g, b });
};

// Map Monet Palette to ThemeColors
export const generateThemeFromMonet = (palette: MonetPalette, isDark: boolean): ThemeColors => {
  const { accent1, accent2, accent3, neutral1, neutral2 } = palette;

  if (isDark) {
    return {
      primary: accent1[200],
      onPrimary: accent1[800],
      primaryContainer: accent1[700],
      onPrimaryContainer: accent1[100],

      secondary: accent2[200],
      onSecondary: accent2[800],
      secondaryContainer: accent2[700],
      onSecondaryContainer: accent2[100],

      tertiary: accent3[200],
      tertiaryContainer: accent3[700],

      background: neutral1[900],
      onBackground: neutral1[100],
      surface: neutral1[900],
      onSurface: neutral1[100],

      surfaceContainer: neutral1[800], // Approx for M3 12
      surfaceContainerHigh: neutral1[800], // Approx for M3 17

      surfaceVariant: neutral2[700],
      onSurfaceVariant: neutral2[200],
      outline: neutral2[400],
    };
  } else {
    return {
      primary: accent1[600],
      onPrimary: accent1[0],
      primaryContainer: accent1[100],
      onPrimaryContainer: accent1[900],

      secondary: accent2[600],
      onSecondary: accent2[0],
      secondaryContainer: accent2[100],
      onSecondaryContainer: accent2[900],

      tertiary: accent3[600],
      tertiaryContainer: accent3[100],

      background: neutral1[10],
      onBackground: neutral1[900],
      surface: neutral1[10],
      onSurface: neutral1[900],

      surfaceContainer: neutral1[50], // Approx for M3 94
      surfaceContainerHigh: neutral1[50], // Approx for M3 92

      surfaceVariant: neutral2[100],
      onSurfaceVariant: neutral2[700],
      outline: neutral2[500],
    };
  }
};

// This function simulates the logic of Material You (Monet)
// taking a "Seed Color" and generating a harmonious palette.
export const generateThemeFromSeed = (seedHex: string, isDark: boolean): ThemeColors => {
  const seed = hexToRgb(seedHex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  const darkSurface = { r: 20, g: 22, b: 19 };
  const lightSurface = { r: 253, g: 252, b: 248 };

  if (isDark) {
    return {
      primary: shiftColor(seed, 20), // Lighter version of seed
      onPrimary: mix(seed, black, 80), // Very dark
      primaryContainer: mix(seed, black, 60), // Darkish
      onPrimaryContainer: shiftColor(seed, 80), // Very Light

      secondary: shiftColor(seed, 10), // Slightly desaturated simulation
      onSecondary: mix(seed, black, 80),
      secondaryContainer: mix(seed, black, 50),
      onSecondaryContainer: shiftColor(seed, 70),

      tertiary: mix(seed, {r: 100, g: 200, b: 200}, 20), // Slight hue shift
      tertiaryContainer: mix(seed, {r: 100, g: 200, b: 200}, 80), // Darker tertiary

      background: rgbToHex(darkSurface),
      onBackground: "#E5E7E2",
      surface: rgbToHex(darkSurface),
      onSurface: "#E5E7E2",

      surfaceContainer: mix(darkSurface, seed, 8),
      surfaceContainerHigh: mix(darkSurface, seed, 12),

      surfaceVariant: mix(darkSurface, seed, 20),
      onSurfaceVariant: "#C6CAC3",
      outline: "#91968C",
    };
  } else {
    // Light Mode Logic
    return {
      primary: seedHex,
      onPrimary: "#FFFFFF",
      primaryContainer: mix(seed, white, 80), // Very light pastel
      onPrimaryContainer: mix(seed, black, 60), // Dark text

      secondary: mix(seed, {r: 120, g: 120, b: 120}, 20), // Desaturated
      onSecondary: "#FFFFFF",
      secondaryContainer: mix(seed, white, 70),
      onSecondaryContainer: mix(seed, black, 70),

      tertiary: mix(seed, {r: 100, g: 200, b: 200}, 30),
      tertiaryContainer: mix(seed, {r: 100, g: 200, b: 200}, 80), // Light tertiary

      background: rgbToHex(lightSurface),
      onBackground: "#1B1C19",
      surface: rgbToHex(lightSurface),
      onSurface: "#1B1C19",

      surfaceContainer: mix(lightSurface, seed, 5),
      surfaceContainerHigh: mix(lightSurface, seed, 8),

      surfaceVariant: mix(lightSurface, seed, 15),
      onSurfaceVariant: "#565B50",
      outline: "#8C9187",
    };
  }
};

export const applyThemeToDom = (colors: ThemeColors) => {
  const root = document.documentElement;
  const cssVariables = [
    ['--md-sys-color-primary', colors.primary],
    ['--md-sys-color-on-primary', colors.onPrimary],
    ['--md-sys-color-primary-container', colors.primaryContainer],
    ['--md-sys-color-on-primary-container', colors.onPrimaryContainer],
    ['--md-sys-color-secondary', colors.secondary],
    ['--md-sys-color-on-secondary', colors.onSecondary],
    ['--md-sys-color-secondary-container', colors.secondaryContainer],
    ['--md-sys-color-on-secondary-container', colors.onSecondaryContainer],
    ['--md-sys-color-tertiary', colors.tertiary],
    ['--md-sys-color-tertiary-container', colors.tertiaryContainer],
    ['--md-sys-color-background', colors.background],
    ['--md-sys-color-on-background', colors.onBackground],
    ['--md-sys-color-surface', colors.surface],
    ['--md-sys-color-on-surface', colors.onSurface],
    ['--md-sys-color-surface-container', colors.surfaceContainer],
    ['--md-sys-color-surface-container-high', colors.surfaceContainerHigh],
    ['--md-sys-color-surface-variant', colors.surfaceVariant],
    ['--md-sys-color-on-surface-variant', colors.onSurfaceVariant],
    ['--md-sys-color-outline', colors.outline],
  ];

  cssVariables.forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Cache the CSS string for initial load
  const cssString = cssVariables.map(([p, v]) => `${p}:${v}`).join(';');
  localStorage.setItem('matcha_cached_theme_css', cssString);
};
