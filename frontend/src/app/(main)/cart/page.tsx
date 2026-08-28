import { Suspense } from 'react';
import { CartPage } from '@/views/CartPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading cart...</div>}>
      <CartPage />
    </Suspense>
  );
}
