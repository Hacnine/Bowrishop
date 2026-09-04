import Link from 'next/link';
import {
  ArrowRight,
  Truck,
  RotateCcw,
  Shield,
  Clock,
  BadgeCheck,
  PackageCheck,
  Headset,
} from "lucide-react";

import { HomePageCarousels, NewsletterForm } from './HomePageCarousels';
import { Hero } from "../components/Hero";
import { FacebookReviewSlider } from "../components/FacebookReviewSlider";
import { faqCategories, FaqSection } from "../components/FaqContent";
import type { Category } from '../types/types.index';

const perks = [
  { icon: Truck, title: "Free Delivery", desc: "On orders over ৳500" },
  { icon: RotateCcw, title: "Easy Returns", desc: "7-day return policy" },
  { icon: Shield, title: "Secure Payment", desc: "bKash & SSL protected" },
  { icon: Clock, title: "Fast Dispatch", desc: "Ships within 24 hours" },
];

interface HomePageProps {
  categories: Category[];
}

export function HomePage({ categories }: HomePageProps) {

  return (
    <>
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
              href="/products"
              className="text-sm text-[#C7927E] font-medium hover:underline flex items-center gap-1 mb-1"
            >
              All categories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?categoryId=${cat.id}`}
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

        {/* ── Promo Banners (Top Set: Hair & Decor) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/products?categoryId=1"
              className="group relative h-44 rounded-3xl overflow-hidden bg-gradient-to-br from-[#F7EDE6] to-[#EDD5C5] flex items-center px-8"
            >
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-[#C7927E] mb-1">
                  New Arrivals
                </p>
                <h3 className="text-2xl font-bold font-cormorant text-[#4A3328] leading-tight mb-3">
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
              href="/products?categoryId=3"
              className="group relative h-44 rounded-3xl overflow-hidden bg-gradient-to-br from-[#2C2118] to-[#4A3328] flex items-center px-8"
            >
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-[#C9A46A] mb-1">
                  Home & Decor
                </p>
                <h3 className="text-2xl font-bold font-cormorant text-white leading-tight mb-3">
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

        {/* Carousels — client component, RTK Query */}
        <HomePageCarousels />

        {/* Facebook customer reviews */}
        <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#C7927E]">
                Customer love
              </p>
              <h2 className="text-3xl font-bold text-[#4A3328]">আমাদের কাস্টমাররা কী বলছেন</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#8A7D70]">
                Facebook-এ আমাদের কাস্টমারদের শেয়ার করা কিছু অভিজ্ঞতা।
              </p>
            </div>
            <FacebookReviewSlider />
          </div>
        </section>

        {/* Frequently asked questions */}
        <section className="bg-[#FDFAF7] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#C7927E]">Help Centre</p>
              <h2 className="text-3xl font-bold text-[#4A3328]">সাধারণ জিজ্ঞাসা</h2>
            </div>
            <div className="space-y-12">
              {faqCategories.map((category) => (
                <FaqSection key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter — client component */}
        <section className="bg-[#2C2118] py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A46A] mb-3">Stay in the loop</p>
            <h2 className="text-3xl font-bold text-white mb-3">Get Exclusive Deals</h2>
            <p className="text-[#A8957F] text-sm pb-4">
              Subscribe and be the first to know about new arrivals, flash sales, and special offers.
            </p>
            <NewsletterForm />
            <p className="text-xs text-white/30 mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </section>
      </div>
    </>
  );
}