import { Suspense } from 'react';
import { ProductsPage } from '@/views/ProductsPage';
import type { Category, PaginatedResponse, Product } from '@/types/types.index';


export const dynamic = 'force-static';

type BackendProductsResponse = Omit<PaginatedResponse<Product>, 'data'> & { products: Product[] };

function getApiUrl(path: string) {
  const configuredUrl = process.env.API_URL ?? 'http://localhost:3001';
  const baseUrl = configuredUrl.endsWith('/api') ? configuredUrl : `${configuredUrl}/api`;
  return `${baseUrl}${path}`;
}

async function getStaticProducts() {
  try {
    const [productsResponse, categoriesResponse] = await Promise.all([
      fetch(getApiUrl('/products?page=1&limit=12'), { cache: 'force-cache' }),
      fetch(getApiUrl('/categories'), { cache: 'force-cache' }),
    ]);

    if (!productsResponse.ok || !categoriesResponse.ok) {
      throw new Error('Failed to fetch static product data');
    }

    const products = (await productsResponse.json()) as BackendProductsResponse;
    const categories = (await categoriesResponse.json()) as Category[];

    return {
      products: {
        data: products.products,
        total: products.total,
        page: products.page,
        limit: products.limit,
        totalPages: products.totalPages,
      },
      categories,
    };
  } catch {
    return { products: undefined, categories: undefined };
  }
}

export default async function Page() {
  const initialData = await getStaticProducts();

  return (
    <Suspense fallback={<div className="p-6">Loading products...</div>}>
      <ProductsPage {...initialData} />
    </Suspense>
  );
}
