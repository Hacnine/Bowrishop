import { Suspense } from 'react';
import { CartPage } from '@/views/CartPage';
import { LoadingState } from '@/components/ui/loader';

export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Loading cart" />}>
      <CartPage />
    </Suspense>
  );
}
