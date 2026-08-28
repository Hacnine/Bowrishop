import { Suspense } from 'react';
import { OAuthCallbackPage } from '@/views/auth/OAuthCallbackPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center">Loading...</div>}>
      <OAuthCallbackPage />
    </Suspense>
  );
}
