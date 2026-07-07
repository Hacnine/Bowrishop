import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useGetFeaturedProductsQuery } from '../features/products/productsApi';
import { useGetCategoriesQuery } from '../features/categories/categoriesApi';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { Hero } from '../components/Hero';

export function HomePage() {
  const { data: featuredData, isLoading: loadingFeatured } =
    useGetFeaturedProductsQuery(8);

  const { data: categories, isLoading: loadingCats } = useGetCategoriesQuery();

  return (
    <div>
      <Hero categories={categories ?? []} />

      {/* Categories grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Shop by category
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {loadingCats
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-gray-100 animate-pulse"
                />
              ))
            : categories?.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?categoryId=${cat.id}`}
                  className="group relative h-28 rounded-2xl overflow-hidden bg-gray-100 hover:shadow-md transition-shadow"
                >
                  {cat.image && (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  <span className="absolute bottom-3 left-3 right-3 text-white font-semibold text-sm">
                    {cat.name}
                  </span>
                </Link>
              ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Featured Products
          </h2>

          <Link
            to="/products"
            className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {loadingFeatured
            ? Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : featuredData?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </section>
    </div>
  );
}