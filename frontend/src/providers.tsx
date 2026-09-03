'use client';

import React, { Suspense } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from '@/app/store';
import { GTMPageTracker } from '@/components/GTMPageTracker';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <Toaster position="top-right" />
      {/* useSearchParams() needs Suspense */}
      <Suspense fallback={null}>
        <GTMPageTracker />
      </Suspense>
      {children}
    </Provider>
  );
}
