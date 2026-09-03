'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useGTM } from '@/hooks/useGTM';

// এই component Providers-এ রাখো
// Next.js-এ route change হলে automatically GTM-এ page_view event যাবে
export function GTMPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPageView } = useGTM();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams]);

  return null;
}
