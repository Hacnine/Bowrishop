import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loader';
import { CheckoutPage } from '@/views/CheckoutPage';

export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Loading checkout" />}>
      <CheckoutPage />
    </Suspense>
  );
}
