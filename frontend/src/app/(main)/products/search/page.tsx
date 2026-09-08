import { Suspense } from 'react';
import { ProductsPage } from '@/views/products/ProductsPage';
import { ProductsPageSkeleton } from '@/views/products/ProductsPageSkeleton';
import { getInitialData } from '../productsPageData';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const { products, categories } = await getInitialData(params, { cache: 'dynamic' });

  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsPage products={products} categories={categories} />
    </Suspense>
  );
}