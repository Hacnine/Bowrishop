import { Suspense } from 'react';
import { CheckoutPage } from '@/views/CheckoutPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading checkout...</div>}>
      <CheckoutPage />
    </Suspense>
  );
}
