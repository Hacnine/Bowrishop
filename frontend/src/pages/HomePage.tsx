import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Truck, RotateCcw } from 'lucide-react';
import { useGetFeaturedProductsQuery } from '../features/products/productsApi';
import { useGetCategoriesQuery } from '../features/categories/categoriesApi';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';

const perks = [
  { icon: Truck, title: 'Free shipping', desc: 'On orders over $50' },
  { icon: RotateCcw, title: 'Easy returns', desc: '30-day return policy' },
  { icon: Shield, title: 'Secure checkout', desc: 'SSL encrypted payments' },
];

const heroSlides = [
  {
    title: 'Discover your next favourite thing',
    description: 'Thousands of products, curated for you.',
    image: '/hero/hero-1.jpg', // Change to .png if needed
    link: '/products?categoryId=1',
  },
  {
    title: 'Fresh arrivals every week',
    description: 'Stay ahead of the trends with our newest collection.',
    image: '/hero/hero-2.jpg',
    link: '/products?categoryId=2',
  },
  {
    title: 'Curated style for every occasion',
    description: 'Find effortless looks crafted for comfort and confidence.',
    image: '/hero/hero-3.jpg',
    link: '/products?categoryId=3',
  },
  {
    title: 'Best Selling Products',
    description: 'Shop our most popular products.',
    image: '/hero/hero-4.jpg',
    link: '/products?featured=true',
  },
  {
    title: 'Special Offers',
    description: "Don't miss our exclusive deals.",
    image: '/hero/hero-5.jpg',
    link: '/products?sale=true',
  },
];

export function HomePage() {
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  const { data: featuredData, isLoading: loadingFeatured } =
    useGetFeaturedProductsQuery(8);

  const { data: categories, isLoading: loadingCats } =
    useGetCategoriesQuery();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden text-white h-[550px] lg:h-[650px]">
        {/* Background Slider */}
        <div className="absolute inset-0">
          {heroSlides.map((slide, index) => (
            <Link
              key={slide.title}
              to={slide.link}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                index === activeHeroIndex
                  ? 'opacity-100 z-10'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-black/40" />
            </Link>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              {heroSlides[activeHeroIndex].title}
            </h1>

            <p className="text-indigo-100 text-lg mb-8">
              {heroSlides[activeHeroIndex].description}
            </p>

            <Button
              asChild
              size="lg"
              className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold"
            >
              <Link to={heroSlides[activeHeroIndex].link}>
                Shop Now
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Slider Dots */}
        <div className="absolute inset-x-0 bottom-8 flex justify-center gap-3 z-30">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setActiveHeroIndex(index)}
              className={`h-3 w-3 rounded-full transition-all ${
                index === activeHeroIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Perks */}
      <section className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {perks.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>

              <div>
                <div className="font-semibold text-gray-900">{title}</div>
                <div className="text-sm text-gray-500">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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