import type { Category, PaginatedResponse, Product } from '@/types/types.index';

type ProductSearchParams = Record<string, string | string[] | undefined>;

type InitialDataOptions = {
  cache: 'static' | 'dynamic';
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getInitialData(
  searchParams: ProductSearchParams = {},
  { cache }: InitialDataOptions,
) {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';
  const query = {
    page: '1',
    limit: '12',
    ...(firstParam(searchParams.q) && { q: firstParam(searchParams.q) }),
    ...(firstParam(searchParams.categoryId) && { categoryId: firstParam(searchParams.categoryId) }),
    ...(firstParam(searchParams.sort) && { sort: firstParam(searchParams.sort) }),
    ...(firstParam(searchParams.minPrice) && { minPrice: firstParam(searchParams.minPrice) }),
    ...(firstParam(searchParams.maxPrice) && { maxPrice: firstParam(searchParams.maxPrice) }),
    ...(firstParam(searchParams.inStock) === 'true' && { inStock: 'true' }),
    ...(firstParam(searchParams.preOrder) === 'true' && { preOrder: 'true' }),
  };
  const fetchOptions: RequestInit = cache === 'dynamic'
    ? { cache: 'no-store' }
    : { next: { revalidate: 60 } };
  const categoryFetchOptions: RequestInit = cache === 'dynamic'
    ? { cache: 'no-store' }
    : { next: { revalidate: 300 } };

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${backendUrl}/api/products?${new URLSearchParams(query)}`, fetchOptions),
      fetch(`${backendUrl}/api/categories`, categoryFetchOptions),
    ]);

    const [productsData, categoriesData] = await Promise.all([
      productsRes.ok ? productsRes.json() : null,
      categoriesRes.ok ? categoriesRes.json() : null,
    ]);

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