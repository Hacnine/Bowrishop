'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useGTM } from '@/hooks/useGTM';
import { useGA4 } from '@/hooks/useGA4';

// এই component Providers-এ রাখো
// Next.js-এ route change হলে automatically GTM-এ page_view event যাবে
export function GTMPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPageView } = useGTM();
  const { trackPageView: trackGA4PageView } = useGA4();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
    trackGA4PageView(url);
  }, [pathname, searchParams]);

  return null;
}
