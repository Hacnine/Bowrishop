'use client';

import { Suspense } from 'react';
import { AdminOrders } from '@/views/admin/AdminOrders';
import { Loader } from '@/components/ui/loader';

export default function Page() {
  return (
    <Suspense fallback={<Loader size="lg" label="Loading orders" />}>
      <AdminOrders />
    </Suspense>
  );
}
