import React, { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import TokenList from './pages/TokenList';
import ThemeSettings from './pages/ThemeSettings';
import { RGB } from './types';
import { rgbToHex, generateThemeFromSeed, applyThemeToDom } from './services/themeService';

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
  const [selectedPreset, setSelectedPreset] = useState<string>('Matcha');
  const [customRgb, setCustomRgb] = useState<RGB>({ r: 135, g: 154, b: 108 }); // Default Matcha Green

  // Lifted State for Scanner to handle Back Button
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Listener for System Dark Mode Changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Calculate Effective Dark Mode
  const isDark = themeMode === 'system' ? systemIsDark : themeMode === 'dark';

  // Apply Dark Mode Class to HTML root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Persist Theme Mode preference
  useEffect(() => {
    localStorage.setItem('matcha_theme_mode', themeMode);
  }, [themeMode]);

  // Apply Dynamic Theme Colors
  useEffect(() => {
    const seedHex = rgbToHex(customRgb);
    const theme = generateThemeFromSeed(seedHex, isDark);
    applyThemeToDom(theme);
  }, [customRgb, isDark]);

  // Handle Android Hardware Back Button (Swipe Back)
  useEffect(() => {
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
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [currentPage, isScannerOpen]);

  return (
    <>
      {currentPage === 'home' && (
        <TokenList 
          onSettingsClick={() => setCurrentPage('settings')} 
          isScannerOpen={isScannerOpen}
          setIsScannerOpen={setIsScannerOpen}
        />
      )}

      {currentPage === 'settings' && (
        <ThemeSettings 
          onBack={() => setCurrentPage('home')} 
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          customRgb={customRgb}
          setCustomRgb={setCustomRgb}
        />
      )}
    </>
  );
};

export default App;