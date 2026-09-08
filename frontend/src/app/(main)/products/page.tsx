import { Suspense } from 'react';
import { ProductsPage } from '@/views/products/ProductsPage';
import { ProductsPageSkeleton } from '@/views/products/ProductsPageSkeleton';

export const revalidate = 7200;

export const metadata = {
  title: 'Shop | Bowri Shop',
  description: 'Browse our full collection of products',
};

import { getInitialData } from './productsPageData';

export default async function Page() {
  const { products, categories } = await getInitialData({}, { cache: 'static' });

  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsPage products={products} categories={categories} />
    </Suspense>
  );
}
