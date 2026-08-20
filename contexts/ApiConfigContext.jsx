import React, { createContext, useContext, useEffect, useState } from 'react';
import { initApiBaseUrl, setApiBaseUrl, getApiBaseUrl } from '@/lib/api';
import { resetSocket } from '@/lib/socket';

const ApiConfigContext = createContext();

export const ApiConfigProvider = ({ children }) => {
  const [apiUrl, setApiUrlState] = useState(getApiBaseUrl());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const activeUrl = await initApiBaseUrl();
      setApiUrlState(activeUrl);
      setIsInitialized(true);
    };
    init();
  }, []);

  const updateApiUrl = async (newUrl) => {
    await setApiBaseUrl(newUrl);
    setApiUrlState(getApiBaseUrl());
    resetSocket();
  };

  const resetToDefault = async () => {
    await setApiBaseUrl(null);
    setApiUrlState(getApiBaseUrl());
    resetSocket();
  };

  const getCleanUrl = (endpoint) => {
    if (!endpoint) return apiUrl;
    if (typeof endpoint === 'string' && (endpoint.startsWith('http://') || endpoint.startsWith('https://'))) return endpoint;
    const cleanBase = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
  };

  return (
    <ApiConfigContext.Provider value={{ apiUrl, updateApiUrl, resetToDefault, isInitialized, getCleanUrl }}>
      {children}
    </ApiConfigContext.Provider>
  );
};

export const useApiConfig = () => {
  const context = useContext(ApiConfigContext);
  if (!context) {
    throw new Error('useApiConfig must be used within an ApiConfigProvider');
  }
  return context;
};
