import { Suspense } from 'react';
import { ProductsPage } from '@/views/products/ProductsPage';
import { ProductsPageSkeleton } from '@/views/products/ProductsPageSkeleton';
import type { Category, PaginatedResponse, Product } from '@/types/types.index';

// ISR — 60 seconds এ revalidate
export const revalidate = 7200;

export const metadata = {
  title: 'Shop | Bowri Shop',
  description: 'Browse our full collection of products',
};

async function getInitialData(searchParams: Record<string, string>) {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(
        `${backendUrl}/api/products?` + new URLSearchParams({
          page: '1',
          limit: '12',
          ...(searchParams.q && { q: searchParams.q }),
          ...(searchParams.categoryId && { categoryId: searchParams.categoryId }),
          ...(searchParams.sort && { sort: searchParams.sort }),
          ...(searchParams.minPrice && { minPrice: searchParams.minPrice }),
          ...(searchParams.maxPrice && { maxPrice: searchParams.maxPrice }),
          ...(searchParams.inStock === 'true' && { inStock: 'true' }),
          ...(searchParams.preOrder === 'true' && { preOrder: 'true' }),
        }),
        { next: { revalidate: 60 } }
      ),
      fetch(`${backendUrl}/api/categories`, { next: { revalidate: 300 } }),
    ]);

    const [productsData, categoriesData] = await Promise.all([
      productsRes.ok ? productsRes.json() : null,
      categoriesRes.ok ? categoriesRes.json() : null,
    ]);

    // Backend returns { products, total, page, limit, totalPages }
    const products: PaginatedResponse<Product> | undefined = productsData
      ? {
          data: productsData.products ?? [],
          total: productsData.total ?? 0,
          page: productsData.page ?? 1,
          limit: productsData.limit ?? 12,
          totalPages: productsData.totalPages ?? 1,
        }
      : undefined;

    return {
      products,
      categories: (categoriesData as Category[]) ?? undefined,
    };
  } catch {
    return { products: undefined, categories: undefined };
  }
}

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const { products, categories } = await getInitialData(params);

  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsPage products={products} categories={categories} />
    </Suspense>
  );
}
