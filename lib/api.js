import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export let API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/";

export const getApiBaseUrl = () => {
  return API_BASE_URL;
};

export const initApiBaseUrl = async () => {
  try {
    let savedUrl = null;
    if (Platform.OS === 'web') {
      savedUrl = localStorage.getItem('custom_api_url');
    } else {
      savedUrl = await SecureStore.getItemAsync('custom_api_url');
    }
    if (savedUrl) {
      API_BASE_URL = savedUrl;
    }
  } catch (err) {
    console.error('Failed to load custom API URL:', err);
  }
  return API_BASE_URL;
};

export const setApiBaseUrl = async (newUrl) => {
  try {
    if (!newUrl) {
      if (Platform.OS === 'web') {
        localStorage.removeItem('custom_api_url');
      } else {
        await SecureStore.deleteItemAsync('custom_api_url');
      }
      API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/";
    } else {
      const formattedUrl = newUrl.endsWith("/") ? newUrl : `${newUrl}/`;
      if (Platform.OS === 'web') {
        localStorage.setItem('custom_api_url', formattedUrl);
      } else {
        await SecureStore.setItemAsync('custom_api_url', formattedUrl);
      }
      API_BASE_URL = formattedUrl;
    }
  } catch (err) {
    console.error('Failed to save custom API URL:', err);
  }
};
