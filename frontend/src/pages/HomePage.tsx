import { Link } from "react-router-dom";
import {
  ArrowRight,
  Truck,
  RotateCcw,
  Shield,
  Clock,
  Flame,
  Tag,
  Sparkles,
  BadgeCheck,
  PackageCheck,
  Headset,
} from "lucide-react";

import {
  useGetFeaturedProductsQuery,
  useGetBestSellingProductsQuery,
  useGetOnSaleProductsQuery,
  useGetNewArrivalProductsQuery,
} from "../features/products/productsApi";
import { useGetCategoriesQuery } from "../features/categories/categoriesApi";
import { ProductCard } from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/ui/Skeleton";
import { Hero } from "../components/Hero";
import SEO from "../components/SEO";

const perks = [
  { icon: Truck, title: "Free Delivery", desc: "On orders over ৳500" },
  { icon: RotateCcw, title: "Easy Returns", desc: "7-day return policy" },
  { icon: Shield, title: "Secure Payment", desc: "bKash & SSL protected" },
  { icon: Clock, title: "Fast Dispatch", desc: "Ships within 24 hours" },
];

function SectionHeader({
  eyebrow,
  title,
  icon: Icon,
  href,
}: {
  eyebrow: string;
  title: string;
  icon: any;
  href: string;
}) {
  return (
    <div className="flex items-end justify-between mb-7">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#F7EDE6] rounded-full flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#C7927E]" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C7927E] mb-0.5">
            {eyebrow}
          </p>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">
            {title}
          </h2>
        </div>
      </div>
      <Link
        to={href}
        className="text-sm text-[#C7927E] font-medium hover:underline flex items-center gap-1 mb-1 whitespace-nowrap"
      >
        View all <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function ProductRow({
  isLoading,
  products,
  count = 5,
}: {
  isLoading: boolean;
  products?: any[];
  count?: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {isLoading
        ? Array.from({ length: count }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))
        : products
            ?.slice(0, count)
            .map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

export function HomePage() {
  const { data: categories, isLoading: loadingCats } = useGetCategoriesQuery();
  const { data: featured, isLoading: loadingFeatured } =
    useGetFeaturedProductsQuery(10);
  const { data: bestSelling, isLoading: loadingBest } =
    useGetBestSellingProductsQuery(10);
  const { data: onSale, isLoading: loadingSale } =
    useGetOnSaleProductsQuery(10);
  const { data: newArrivals, isLoading: loadingNew } =
    useGetNewArrivalProductsQuery(10);

  return (
    <>
    <SEO
        title="Bowri Shop | Home, Kitchen, Beauty, Electronics, Clothing & Footwear"
        description="Shop home essentials, kitchenware, beauty products, electronics, clothing, footwear and more at Bowri Shop. Fast delivery across Bangladesh."
      />

      <div className="bg-[#FDFAF7]">
      {/* ── Hero ── */}
      <Hero categories={categories ?? []} />

      {/* ── Trust bar ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {perks.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-[#F7EDE6] rounded-full flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#C7927E]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {title}
                </p>
                <p className="text-xs text-gray-500 leading-tight">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-6">
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C7927E] mb-1">
              Browse
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/products"
            className="text-sm text-[#C7927E] font-medium hover:underline flex items-center gap-1 mb-1"
          >
            All categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {loadingCats
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl bg-gray-100 animate-pulse"
                />
              ))
            : categories?.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?categoryId=${cat.id}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-[#F0E8DF]"
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F0E8DF] to-[#DFD0C2]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <span className="block text-white font-semibold text-sm leading-tight">
                      {cat.name}
                    </span>
                    {cat._count?.products != null && (
                      <span className="text-white/70 text-xs">
                        {cat._count.products} items
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 ring-2 ring-inset ring-[#C7927E]/0 group-hover:ring-[#C7927E]/60 rounded-2xl transition-all duration-300" />
                </Link>
              ))}
        </div>
      </section>

      {/* ── Promo banners ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/products?categoryId=1"
            className="group relative h-44 rounded-3xl overflow-hidden bg-gradient-to-br from-[#F7EDE6] to-[#EDD5C5] flex items-center px-8"
          >
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest text-[#C7927E] mb-1">
                New Arrivals
              </p>
              <h3 className="text-2xl font-bold text-[#4A3328] leading-tight mb-3">
                Hair
                <br />
                Accessories
              </h3>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#C7927E] group-hover:gap-2 transition-all">
                Shop now <ArrowRight className="w-4 h-4" />
              </span>
            </div>
            <div className="absolute right-0 bottom-0 w-40 h-40 opacity-20 bg-[#C7927E] rounded-full translate-x-10 translate-y-10" />
          </Link>
          <Link
            to="/products?categoryId=3"
            className="group relative h-44 rounded-3xl overflow-hidden bg-gradient-to-br from-[#2C2118] to-[#4A3328] flex items-center px-8"
          >
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest text-[#C9A46A] mb-1">
                Home & Decor
              </p>
              <h3 className="text-2xl font-bold text-white leading-tight mb-3">
                Light Up
                <br />
                Your Space
              </h3>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#C9A46A] group-hover:gap-2 transition-all">
                Explore <ArrowRight className="w-4 h-4" />
              </span>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-32 h-32 opacity-10 bg-[#C9A46A] rounded-full" />
          </Link>
        </div>
      </section>

      {/* ── Best Selling ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeader
          eyebrow="Most Popular"
          title="Best Selling"
          icon={Flame}
          href="/products?sort=best_selling"
        />
        <ProductRow isLoading={loadingBest} products={bestSelling} />
      </section>

      {/* ── Flash Sale Banner ── */}
      {onSale && onSale.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative bg-gradient-to-r from-[#C7927E] to-[#A97462] rounded-3xl px-8 py-6 flex items-center justify-between overflow-hidden">
            <div className="relative z-10">
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">
                Limited Time
              </p>
              <h3 className="text-white text-2xl font-bold">
                Special Offers & Deals
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Save big on selected items — while stocks last
              </p>
            </div>
            <Link
              to="/products?sale=true"
              className="relative z-10 flex-shrink-0 bg-white text-[#C7927E] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#FFF5F0] transition-colors"
            >
              Shop Deals →
            </Link>
            <div className="absolute right-0 top-0 w-48 h-full opacity-10 bg-white rounded-full translate-x-20" />
          </div>
        </section>
      )}

      {/* ── On Sale ── */}
      {onSale && onSale.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SectionHeader
            eyebrow="Save More"
            title="On Sale Now"
            icon={Tag}
            href="/products?sale=true"
          />
          <ProductRow isLoading={loadingSale} products={onSale} />
        </section>
      )}

      {/* ── Featured ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeader
          eyebrow="Hand-picked"
          title="Featured Products"
          icon={Sparkles}
          href="/products?featured=true"
        />
        <ProductRow isLoading={loadingFeatured} products={featured} />
      </section>

      {/* ── New Arrivals ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <SectionHeader
          eyebrow="Just Landed"
          title="New Arrivals"
          icon={ArrowRight}
          href="/products?sort=newest"
        />
        <ProductRow isLoading={loadingNew} products={newArrivals} />
      </section>

      {/* ── Why Choose Us ── */}
      <section className="bg-[#F7EDE6] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C7927E] mb-2">
              Our Promise
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              Why Shop with Bowri?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              {
                Icon: BadgeCheck,
                title: "Curated Quality",
                desc: "Every product is hand-picked for style, durability, and value. No compromises.",
              },
              {
                Icon: PackageCheck,
                title: "Fast & Safe Delivery",
                desc: "We pack with care and ship fast. Your order arrives exactly as expected.",
              },
              {
                Icon: Headset,
                title: "Friendly Support",
                desc: "Questions? Our team responds quickly to help you before and after your purchase.",
              },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-center mb-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#F7EDE6]">
                    <Icon className="w-7 h-7 text-[#C7927E]" strokeWidth={2} />
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="bg-[#2C2118] py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A46A] mb-3">
            Stay in the loop
          </p>
          <h2 className="text-3xl font-bold text-white mb-3">
            Get Exclusive Deals
          </h2>
          <p className="text-[#A8957F] text-sm pb-4">
            Subscribe and be the first to know about new arrivals, flash sales,
            and special offers.
          </p>
          <form
            className="flex gap-2 max-w-md mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#C9A46A] transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#C9A46A] text-[#2C2118] font-semibold text-sm rounded-xl hover:bg-[#D7B87A] transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
          <p className="text-xs text-white/30 mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
    </>
    
  );
}
