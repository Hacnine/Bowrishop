'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { store } from '@/app/store';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <HelmetProvider>
        <Toaster position="top-right" />
        {children}
      </HelmetProvider>
    </Provider>
  );
}
