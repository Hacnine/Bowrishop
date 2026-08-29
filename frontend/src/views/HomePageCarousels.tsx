'use client';

import {
  ArrowRight, Flame, Tag, Sparkles, Eye, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import {
  useGetFeaturedProductsQuery,
  useGetBestSellingProductsQuery,
  useGetOnSaleProductsQuery,
  useGetNewArrivalProductsQuery,
  useGetMostViewedProductsQuery,
} from '../features/products/productsApi';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import Link from 'next/link';

function SectionHeader({ eyebrow, title, icon: Icon, href, accentColor = 'text-[#C7927E]', bgColor = 'bg-[#F7EDE6]', prevId, nextId }: {
  eyebrow: string; title: string; icon: any; href: string;
  accentColor?: string; bgColor?: string; prevId: string; nextId: string;
}) {
  return (
    <div className="flex items-end justify-between mb-7">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${accentColor}`} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C7927E] mb-0.5">{eyebrow}</p>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h2>
        </div>
      </div>
      <div className="flex items-center gap-4 mb-1">
        <div className="flex items-center gap-1.5">
          <button id={prevId} className="w-8 h-8 rounded-xl bg-white border border-[#EFE5DD] text-[#4A3328] flex items-center justify-center hover:bg-[#F7EDE6] hover:text-[#C7927E] transition-colors disabled:opacity-40 disabled:pointer-events-none">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button id={nextId} className="w-8 h-8 rounded-xl bg-white border border-[#EFE5DD] text-[#4A3328] flex items-center justify-center hover:bg-[#F7EDE6] hover:text-[#C7927E] transition-colors disabled:opacity-40 disabled:pointer-events-none">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <span className="w-px h-4 bg-gray-200" />
        <Link href={href} className="text-sm text-[#C7927E] font-medium hover:underline flex items-center gap-1 whitespace-nowrap">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function ProductCarousel({ isLoading, products, count = 10, prevId, nextId }: {
  isLoading: boolean; products?: any[]; count?: number; prevId: string; nextId: string;
}) {
  const breakpoints = {
    320: { slidesPerView: 2, spaceBetween: 12 },
    640: { slidesPerView: 3, spaceBetween: 16 },
    1024: { slidesPerView: 5, spaceBetween: 16 },
  };

  if (isLoading) {
    return (
      <Swiper modules={[Navigation]} navigation={{ prevEl: `#${prevId}`, nextEl: `#${nextId}` }} breakpoints={breakpoints} className="product-swiper">
        {Array.from({ length: 5 }).map((_, i) => (
          <SwiperSlide key={i}><ProductCardSkeleton /></SwiperSlide>
        ))}
      </Swiper>
    );
  }

  return (
    <Swiper
      modules={[Navigation, Autoplay]}
      navigation={{ prevEl: `#${prevId}`, nextEl: `#${nextId}` }}
      loop={true}
      autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
      breakpoints={breakpoints}
      className="product-swiper"
    >
      {products?.slice(0, count).map((p) => (
        <SwiperSlide key={p.id} className="h-full">
          <ProductCard product={p} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

export function HomePageCarousels() {
  const { data: bestSellingProducts, isLoading: loadingBest } = useGetBestSellingProductsQuery(10);
  const { data: saleProducts, isLoading: loadingSale } = useGetOnSaleProductsQuery(10);
  const { data: featuredProducts, isLoading: loadingFeatured } = useGetFeaturedProductsQuery(10);
  const { data: arrivalProducts, isLoading: loadingNew } = useGetNewArrivalProductsQuery(10);
  const { data: viewedProducts, isLoading: loadingViewed } = useGetMostViewedProductsQuery(10);

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeader eyebrow="Most Popular" title="Best Selling" icon={Flame} href="/products?sort=best_selling" prevId="best-prev" nextId="best-next" />
        <ProductCarousel isLoading={loadingBest} products={bestSellingProducts} prevId="best-prev" nextId="best-next" />
      </section>

      {saleProducts && saleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative bg-gradient-to-r from-[#C7927E] to-[#A97462] rounded-3xl px-8 py-6 flex items-center justify-between overflow-hidden">
            <div className="relative z-10">
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Limited Time</p>
              <h3 className="text-white text-2xl font-bold">Special Offers & Deals</h3>
              <p className="text-white/80 text-sm mt-1">Save big on selected items — while stocks last</p>
            </div>
            <Link href="/products?sale=true" className="relative z-10 flex-shrink-0 bg-white text-[#C7927E] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#FFF5F0] transition-colors">
              Shop Deals →
            </Link>
            <div className="absolute right-0 top-0 w-48 h-full opacity-10 bg-white rounded-full translate-x-20" />
          </div>
        </section>
      )}

      {saleProducts && saleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SectionHeader eyebrow="Save More" title="On Sale Now" icon={Tag} href="/products?sale=true" prevId="sale-prev" nextId="sale-next" />
          <ProductCarousel isLoading={loadingSale} products={saleProducts} prevId="sale-prev" nextId="sale-next" />
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeader eyebrow="Hand-picked" title="Featured Products" icon={Sparkles} href="/products?featured=true" prevId="feat-prev" nextId="feat-next" />
        <ProductCarousel isLoading={loadingFeatured} products={featuredProducts} prevId="feat-prev" nextId="feat-next" />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeader eyebrow="Just Landed" title="New Arrivals" icon={ArrowRight} href="/products?sort=newest" prevId="new-prev" nextId="new-next" />
        <ProductCarousel isLoading={loadingNew} products={arrivalProducts} prevId="new-prev" nextId="new-next" />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeader eyebrow="Trending Now" title="Most Viewed" icon={Eye} href="/products" accentColor="text-purple-500" bgColor="bg-purple-50" prevId="viewed-prev" nextId="viewed-next" />
        <ProductCarousel isLoading={loadingViewed} products={viewedProducts} prevId="viewed-prev" nextId="viewed-next" />
      </section>
    </>
  );
}

export function NewsletterForm() {
  return (
    <form className="flex gap-2 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
      <input
        type="email"
        placeholder="Enter your email"
        className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#C9A46A] transition-colors"
      />
      <button type="submit" className="px-6 py-3 bg-[#C9A46A] text-[#2C2118] font-semibold text-sm rounded-xl hover:bg-[#D7B87A] transition-colors whitespace-nowrap">
        Subscribe
      </button>
    </form>
  );
}
