import React, { useState, useEffect, useLayoutEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { motion, AnimatePresence } from 'framer-motion';
import TokenList from './pages/TokenList';
import ThemeSettings from './pages/ThemeSettings';
import { RGB, ThemeColors } from './types';
import { rgbToHex, generateThemeFromSeed, generateThemeFromMonet, applyThemeToDom } from './services/themeService';
import { getMonetColors, MonetPalette } from './services/monetService';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'settings'>('home');

  // Theme Mode State: 'light' | 'dark' | 'system'
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('matcha_theme_mode') as 'light' | 'dark' | 'system') || 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState(
      window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Lifted State for Theme persistence within session
  const [selectedPreset, setSelectedPreset] = useState<string>(() => {
    return localStorage.getItem('matcha_selected_preset') || 'Matcha';
  });

  const [customRgb, setCustomRgb] = useState<RGB>(() => {
    const savedRgb = localStorage.getItem('matcha_custom_rgb');
    return savedRgb ? JSON.parse(savedRgb) : { r: 135, g: 154, b: 108 }; // Default Matcha Green
  });

  const [monetPalette, setMonetPalette] = useState<MonetPalette | null>(() => {
    const savedPalette = localStorage.getItem('matcha_monet_palette');
    return savedPalette ? JSON.parse(savedPalette) : null;
  });

  // Lifted State for Scanner to handle Back Button
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Listener for System Dark Mode Changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Fetch Monet Colors on Mount
  useEffect(() => {
    const fetchMonet = async () => {
      const palette = await getMonetColors();
      if (palette) {
        setMonetPalette(palette);
        localStorage.setItem('matcha_monet_palette', JSON.stringify(palette));
      }
    };
    fetchMonet();
  }, []);

  // Persist Selected Preset
  useEffect(() => {
    localStorage.setItem('matcha_selected_preset', selectedPreset);
  }, [selectedPreset]);

  // Persist Custom RGB
  useEffect(() => {
    localStorage.setItem('matcha_custom_rgb', JSON.stringify(customRgb));
  }, [customRgb]);

  // Persist Theme Mode preference
  useEffect(() => {
    localStorage.setItem('matcha_theme_mode', themeMode);
  }, [themeMode]);


  // Calculate Effective Dark Mode immediately
  const isDark = themeMode === 'system' ? systemIsDark : themeMode === 'dark';

  // Apply Dark Mode Class immediately on mount/change to prevent flash
  // Doing this in render phase (or useLayoutEffect) is better for preventing flash than useEffect
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Apply Initial Theme immediately if not dynamic, or wait for Monet if dynamic
  // We can try to apply this synchronously if possible, or at least useLayoutEffect
  useLayoutEffect(() => {
    let theme: ThemeColors | null = null;
    if (selectedPreset === 'Dynamic') {
      if (monetPalette) {
        theme = generateThemeFromMonet(monetPalette, isDark);
      }
      // If dynamic is selected but monet not loaded yet, do nothing (or keep previous theme)
      // to avoid flashing default green.
    } else {
      const seedHex = rgbToHex(customRgb);
      theme = generateThemeFromSeed(seedHex, isDark);
    }

    if (theme) {
      applyThemeToDom(theme);
      // Set status bar color and style
      // For dark theme, we want light text (Style.Dark)
      // For light theme, we want dark text (Style.Light)
      // Wait, Style.Dark usually means "Dark Content" (Dark Text) on iOS/Android
      // Style.Light usually means "Light Content" (Light Text)
      const style = isDark ? Style.Dark : Style.Light;

      StatusBar.setBackgroundColor({ color: theme.background }).catch(() => {});
      StatusBar.setStyle({ style }).catch(() => {});
    }
  }, [customRgb, isDark, selectedPreset, monetPalette]);

  // Handle Android Hardware Back Button (Swipe Back)
  useEffect(() => {
    // Remove preload class after mount to enable transitions
    const timer = setTimeout(() => {
      document.body.classList.remove('preload');
    }, 100);

    let backButtonListener: any;

    const setupBackListener = async () => {
      // Register listener for the hardware back button
      backButtonListener = await CapacitorApp.addListener('backButton', () => {
        if (isScannerOpen) {
          // If scanner is open, close it first
          setIsScannerOpen(false);
        } else if (currentPage === 'settings') {
          // If in settings, go back to home
          setCurrentPage('home');
        } else {
          // If on home and no scanner, exit the app
          CapacitorApp.exitApp();
        }
      });
    };

    setupBackListener();

    return () => {
      clearTimeout(timer);
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [currentPage, isScannerOpen]);

  return (
      <AnimatePresence mode="wait">
        {currentPage === 'home' && (
            <motion.div
                key="home"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
            >
              <TokenList
                  onSettingsClick={() => setCurrentPage('settings')}
                  isScannerOpen={isScannerOpen}
                  setIsScannerOpen={setIsScannerOpen}
              />
            </motion.div>
        )}

        {currentPage === 'settings' && (
            <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
            >
              <ThemeSettings
                  onBack={() => setCurrentPage('home')}
                  themeMode={themeMode}
                  setThemeMode={setThemeMode}
                  selectedPreset={selectedPreset}
                  setSelectedPreset={setSelectedPreset}
                  customRgb={customRgb}
                  setCustomRgb={setCustomRgb}
                  isMonetAvailable={!!monetPalette}
              />
            </motion.div>
        )}
      </AnimatePresence>
  );
};

export default App;