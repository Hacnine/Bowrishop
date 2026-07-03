import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useGetProductsQuery } from '../features/products/productsApi';
import { useGetCategoriesQuery } from '../features/categories/categoriesApi';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { cn } from '../utils';

const SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const q = searchParams.get('q') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const inStock = searchParams.get('inStock') === 'true';
  const page = Number(searchParams.get('page') ?? '1');

  const setParam = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      next.delete('page');
      return next;
    });
  }, [setSearchParams]);

  const { data, isLoading } = useGetProductsQuery({
    q: q || undefined,
    categoryId: categoryId || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort: sort || undefined,
    inStock: inStock || undefined,
    page,
    limit: 12,
  });

  const { data: categories } = useGetCategoriesQuery();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Search + sort bar */}
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
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button
          className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-gray-50"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      <div className="flex gap-8">
        {/* Filter sidebar */}
        {showFilters && (
          <aside className="w-56 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Filters</span>
                <button onClick={() => setShowFilters(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>

              {/* Categories */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="cat" value="" checked={!categoryId} onChange={() => setParam('categoryId', '')} className="text-indigo-600" />
                    <span className="text-sm text-gray-700">All</span>
                  </label>
                  {categories?.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="cat" value={c.id} checked={categoryId === c.id} onChange={() => setParam('categoryId', c.id)} className="text-indigo-600" />
                      <span className="text-sm text-gray-700">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Price range</p>
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="Min" min={0}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                    defaultValue={minPrice}
                    onBlur={(e) => setParam('minPrice', e.target.value)}
                  />
                  <input
                    type="number" placeholder="Max" min={0}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                    defaultValue={maxPrice}
                    onBlur={(e) => setParam('maxPrice', e.target.value)}
                  />
                </div>
              </div>

              {/* In stock */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setParam('inStock', e.target.checked ? 'true' : '')}
                  className="rounded text-indigo-600"
                />
                <span className="text-sm text-gray-700">In stock only</span>
              </label>

              {/* Clear */}
              <Button variant="outline" size="sm" className="w-full" onClick={() => setSearchParams({})}>
                Clear filters
              </Button>
            </div>
          </aside>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-500 text-lg">No products found.</p>
              <Button variant="outline" className="mt-4" onClick={() => setSearchParams({})}>Clear search</Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{data.total} products</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.data.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('page', String(p)); return n; })}
                      className={cn(
                        'w-9 h-9 rounded-lg text-sm font-medium',
                        p === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50',
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
