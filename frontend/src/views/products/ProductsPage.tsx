'use client';

import { useState, useCallback, useEffect, useReducer, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { useGetProductsQuery } from '@/features/products/productsApi';
import { useGetCategoriesQuery } from '@/features/categories/categoriesApi';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import type { Category, PaginatedResponse, Product } from '@/types/types.index';
import { Button } from '@/components/ui/button';

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
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

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

  const { data: categories = initialCategories } = useGetCategoriesQuery();

  const toggleCatExpand = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search products…"
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('q', (e.target as HTMLInputElement).value);
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
        <button
          className="flex items-center gap-2 border border-gray-300 cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-gray-50"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {(categoryId || minPrice || maxPrice || inStock || preOrder) && (
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
          )}
        </button>
      </div>

      <div className="flex gap-8">
        {showFilters && (
          <aside className="w-56 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-6 sticky top-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Filters</span>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</p>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <input type="radio" name="cat" value="" checked={!categoryId} onChange={() => setParam('categoryId', '')} className="text-indigo-600" />
                    <span className="text-sm text-gray-700">All</span>
                  </label>
                  {categories?.map((root) => {
                    const hasSubs = (root.subCategories?.length ?? 0) > 0;
                    const isExpanded = expandedCats.has(root.id);
                    const isSelected = categoryId === root.id;
                    const childSelected = root.subCategories?.some((s) => s.id === categoryId);
                    return (
                      <div key={root.id}>
                        <div className="flex items-center gap-1">
                          {hasSubs && (
                            <button type="button" onClick={() => toggleCatExpand(root.id)} className="p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
                              {isExpanded || childSelected ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <label className={`flex items-center gap-2 cursor-pointer py-1 flex-1 ${!hasSubs ? 'pl-5' : ''}`}>
                            <input
                              type="radio" name="cat" value={root.id} checked={isSelected}
                              onChange={() => { setParam('categoryId', root.id); if (hasSubs) setExpandedCats((prev) => new Set([...prev, root.id])); }}
                              className="text-indigo-600"
                            />
                            <span className={`text-sm ${isSelected || childSelected ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>{root.name}</span>
                            {root._count?.products !== undefined && (
                              <span className="text-xs text-gray-400 ml-auto">
                                {root._count.products + (root.subCategories?.reduce((s, c) => s + (c._count?.products ?? 0), 0) ?? 0)}
                              </span>
                            )}
                          </label>
                        </div>
                        {hasSubs && (isExpanded || childSelected) && (
                          <div className="ml-7 mt-0.5 space-y-0.5 border-l border-gray-100 pl-3">
                            {root.subCategories!.map((sub) => (
                              <label key={sub.id} className="flex items-center gap-2 cursor-pointer py-1">
                                <input type="radio" name="cat" value={sub.id} checked={categoryId === sub.id} onChange={() => setParam('categoryId', sub.id)} className="text-indigo-600" />
                                <span className={`text-sm ${categoryId === sub.id ? 'text-indigo-700 font-medium' : 'text-gray-600'}`}>{sub.name}</span>
                                {sub._count?.products !== undefined && <span className="text-xs text-gray-400 ml-auto">{sub._count.products}</span>}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Price range</p>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" min={0} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" defaultValue={minPrice} onBlur={(e) => setParam('minPrice', e.target.value)} />
                  <input type="number" placeholder="Max" min={0} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" defaultValue={maxPrice} onBlur={(e) => setParam('maxPrice', e.target.value)} />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={inStock} onChange={(e) => setParam('inStock', e.target.checked ? 'true' : '')} className="rounded text-indigo-600" />
                <span className="text-sm text-gray-700">In stock only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={preOrder} onChange={(e) => setParam('preOrder', e.target.checked ? 'true' : '')} className="rounded text-amber-600" />
                <span className="text-sm text-gray-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Pre-order only
                </span>
              </label>

              <Button variant="outline" size="sm" className="w-full cursor-pointer" onClick={() => router.push(pathname)}>
                Clear filters
              </Button>
            </div>
          </aside>
        )}

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
  // page ref — observer closure এ stale state এর সমস্যা avoid করতে
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

  // data আসলে accumulate করো
  useEffect(() => {
    if (!data) return;
    dispatch({ type: page === 1 ? 'replace' : 'append', products: data.data });
  }, [data]);  // page dependency সরানো হয়েছে — data change এ fire হলেই যথেষ্ট

  // ── Fix: observer কে isFetching বা page এর উপর depend করানো হয়নি ──
  // totalPages ref ব্যবহার করো যাতে observer reconnect না করতে হয়
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
  }, [products]); // products change হলে sentinel এর position update হয়, reconnect করো

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
      {/* Loading skeletons — sentinel এর উপরে */}
      {isFetching && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full mt-6">
          {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}
      {/* Sentinel — সবসময় render হয়, height আছে, observer সবসময় দেখতে পায় */}
      <div ref={loadMoreRef} style={{ height: '1px' }} className="mt-10" />
    </>
  );
}