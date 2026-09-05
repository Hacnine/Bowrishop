'use client';

import { useState, useCallback, useEffect, useReducer, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useGetProductsQuery } from '@/features/products/productsApi';
import { useGetCategoriesQuery } from '@/features/categories/categoriesApi';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import type { Category, PaginatedResponse, Product } from '@/types/types.index';
import { Button } from '@/components/ui/button';
import { useGTM } from '@/hooks/useGTM';
import { useGA4 } from '@/hooks/useGA4';
import { ProductFilters } from './ProductFilters';
import { ProductFilterDrawer } from './ProductFilterDrawer';

const SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

type ProductsPageProps = {
  products?: PaginatedResponse<Product>;
  categories?: Category[];
};

export function ProductsPage({ products: initialProducts, categories: initialCategories }: ProductsPageProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '/products';
  const searchParams = useSearchParams();
  const { trackSearch } = useGTM();
  const { trackSearch: trackGA4Search } = useGA4();

  // Mobile drawer state — false by default (correct on server + client, no hydration mismatch)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const q = searchParams.get('q') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const inStock = searchParams.get('inStock') === 'true';
  const preOrder = searchParams.get('preOrder') === 'true';

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      const query = next.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const filterKey = `${q}|${categoryId}|${minPrice}|${maxPrice}|${sort}|${inStock}|${preOrder}`;
  const hasActiveFilters = !!(categoryId || minPrice || maxPrice || inStock || preOrder);

  const { data: categories = initialCategories } = useGetCategoriesQuery();

  const sharedFilterProps = {
    categories,
    categoryId,
    minPrice,
    maxPrice,
    inStock,
    preOrder,
    onParamChange: setParam,
    onClear: () => router.push(pathname),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Search bar + sort + mobile filter trigger */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search products…"
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const term = (e.target as HTMLInputElement).value.trim();
                if (term) {
                  trackSearch(term);
                  trackGA4Search(term);
                }
                setParam('q', term);
              }
            }}
          />
        </div>

        <select
          className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Mobile-only filter trigger */}
        <button
          className="lg:hidden flex items-center gap-2 border border-gray-300 cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-gray-50"
          onClick={() => setMobileFiltersOpen(true)}
          aria-label="Open filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar — always visible, no JS state involved */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <ProductFilters {...sharedFilterProps} />
        </aside>

        {/* Mobile drawer — slide-in from left, closed by default */}
        <ProductFilterDrawer
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          {...sharedFilterProps}
        />

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          <ProductResults
            key={filterKey}
            q={q}
            categoryId={categoryId}
            minPrice={minPrice}
            maxPrice={maxPrice}
            sort={sort}
            inStock={inStock}
            preOrder={preOrder}
            initialData={initialProducts}
            onClear={() => router.push(pathname)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── ProductResults (unchanged) ───────────────────────────────────────────────

type ProductResultsProps = {
  q: string;
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  inStock: boolean;
  preOrder: boolean;
  initialData?: PaginatedResponse<Product>;
  onClear: () => void;
};

type ProductAction = { type: 'replace' | 'append'; products: Product[] };

function productReducer(previous: Product[], action: ProductAction) {
  if (action.type === 'replace') return action.products;
  return [...previous, ...action.products.filter((p) => !previous.some((item) => item.id === p.id))];
}

function ProductResults({ q, categoryId, minPrice, maxPrice, sort, inStock, preOrder, initialData, onClear }: ProductResultsProps) {
  const [page, setPage] = useState(1);
  const [products, dispatch] = useReducer(productReducer, initialData?.data ?? []);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(page);
  pageRef.current = page;

  const { data, isLoading, isFetching } = useGetProductsQuery({
    q: q || undefined,
    categoryId: categoryId || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort: sort || undefined,
    inStock: inStock || undefined,
    preOrder: preOrder || undefined,
    page,
    limit: 12,
  });

  useEffect(() => {
    if (!data) return;
    dispatch({ type: page === 1 ? 'replace' : 'append', products: data.data });
  }, [data]);

  const totalPagesRef = useRef(1);
  if (data) totalPagesRef.current = data.totalPages;

  const isFetchingRef = useRef(false);
  isFetchingRef.current = isFetching;

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          !isFetchingRef.current &&
          pageRef.current < totalPagesRef.current
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: '600px', threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [products]);

  if (isLoading && products.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500 text-lg">No products found.</p>
        <Button variant="outline" className="mt-4" onClick={onClear}>Clear search</Button>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">{data?.total ?? initialData?.total} products</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
      {isFetching && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full mt-6">
          {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}
      <div ref={loadMoreRef} style={{ height: '1px' }} className="mt-10" />
    </>
  );
}
