import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loader';
import { OAuthCallbackPage } from '@/views/auth/OAuthCallbackPage';

export default function Page() {
  return (
    <Suspense fallback={<LoadingState className="min-h-[60vh]" />}>
      <OAuthCallbackPage />
    </Suspense>
  );
}
