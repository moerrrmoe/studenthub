import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import { Uniwind } from 'uniwind';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('light');

  const applyTheme = (newTheme) => {
    Uniwind.setTheme(newTheme);
    if (Platform.OS === 'web') {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  useEffect(() => {
    const loadTheme = async () => {
      try {
        let storedTheme = null;
        if (Platform.OS === 'web') {
          storedTheme = localStorage.getItem('theme');
        } else {
          storedTheme = await SecureStore.getItemAsync('theme');
        }
        if (storedTheme === 'dark' || storedTheme === 'light') {
          setThemeState(storedTheme);
          applyTheme(storedTheme);
        } else {
          // Default to system settings if no preference is saved
          const systemTheme = Appearance.getColorScheme() || 'light';
          setThemeState(systemTheme);
          applyTheme(systemTheme);
        }
      } catch (e) {
        console.error("Failed to load theme preference:", e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('theme', newTheme);
      } else {
        await SecureStore.setItemAsync('theme', newTheme);
      }
    } catch (e) {
      console.error("Failed to save theme preference:", e);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
