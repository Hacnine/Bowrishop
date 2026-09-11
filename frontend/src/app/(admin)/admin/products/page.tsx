import { Suspense } from 'react';
import { AdminProducts } from '@/views/admin/AdminProducts';
import { LoadingState } from '@/components/ui/loader';

export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Loading products" />}>
      <AdminProducts />
    </Suspense>
  );
}
