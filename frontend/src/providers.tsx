'use client';

import React, { Suspense, useRef } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { makeStore } from '@/app/store';
import type { AppStore } from '@/app/store';
import { GTMPageTracker } from '@/components/GTMPageTracker';

export function Providers({ children }: { children: React.ReactNode }) {
  // useRef দিয়ে per-mount store — SSR এ আলাদা, client এ একটাই
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <Toaster position="top-right" />
      <Suspense fallback={null}>
        <GTMPageTracker />
      </Suspense>
      {children}
    </Provider>
  );
}