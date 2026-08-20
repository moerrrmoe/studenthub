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

  return (
    <ApiConfigContext.Provider value={{ apiUrl, updateApiUrl, resetToDefault, isInitialized }}>
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
