import { Heart, MapPin, Globe, ShoppingBag, Sparkles, Truck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import SEO from '../components/SEO';

const values = [
  {
    icon: Sparkles,
    title: 'Curated with Care',
    desc: "Every item on Bowri Shop is handpicked — we only carry what we'd proudly give to someone we love.",
  },
  {
    icon: ShieldCheck,
    title: 'Quality You Can Trust',
    desc: 'We work directly with reliable suppliers to ensure every product meets our quality bar before it reaches you.',
  },
  {
    icon: Truck,
    title: 'Fast & Reliable Delivery',
    desc: 'We ship across Bangladesh with care, making sure your order arrives safely and on time.',
  },
  {
    icon: Heart,
    title: 'Built on Community',
    desc: 'Bowri Shop started as a small local idea. Your support keeps it growing — thank you for being part of it.',
  },
];

const categories = [
  'Home Essentials',
  'Kitchenware',
  'Beauty & Skincare',
  'Electronics',
  'Clothing',
  'Footwear',
];

export function AboutPage() {
  return (
    <>
      <SEO
        title="About Us | Bowri Shop"
        description="Learn about Bowri Shop — your destination for home essentials, kitchenware, beauty products, electronics, clothing and more at affordable prices."
        canonical="https://www.bowrishop.com/about"
      />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative h-[520px] lg:h-[600px] overflow-hidden">
        <img
          src="/aboutus/shopfront.png"
          alt="Bowri Shop storefront"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        {/* Dark gradient from bottom so text reads cleanly */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2E1F17]/90 via-[#2E1F17]/30 to-transparent" />

        <div className="relative h-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-14">
          <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#D7A99A] mb-3">
            Our Story
          </span>
          <h1 className="font-cormorant text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            Small things,<br />
            <span className="italic text-[#D7A99A]">big difference.</span>
          </h1>
          <p className="text-[#EFE4D8] text-lg leading-relaxed max-w-xl mb-7">
            Bowri Shop started with a simple belief — the right product, at the right price,
            can make everyday life a little more beautiful. We're a Bangladeshi shop built
            for real homes, real kitchens, and real people.
          </p>
          <Link to="/products">
            <Button className="bg-[#C7927E] hover:bg-[#A97462] text-white rounded-full px-8 w-fit">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Shop Now
            </Button>
          </Link>
        </div>
      </section>

      {/* ── What we sell ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#C7927E] mb-3">
              What we carry
            </span>
            <h2 className="font-cormorant text-4xl font-bold text-[#4A3328] mb-5 leading-tight">
              Everything your home and life needs
            </h2>
            <p className="text-[#8A7D70] leading-relaxed mb-8">
              From the kitchen to the bedroom, from your morning routine to your evening wind-down —
              Bowri Shop carries thoughtfully chosen products across six categories, all under one roof.
            </p>
            <div className="flex flex-wrap gap-2 mb-10">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="text-sm font-medium text-[#4A3328] bg-[#F7F1EA] border border-[#EFE4D8] px-4 py-1.5 rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* Inline stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#EFE4D8]">
              {[
                { number: '6+', label: 'Categories' },
                { number: '100%', label: 'Quality checked' },
                { number: '🇧🇩', label: 'Made for Bangladesh' },
              ].map(({ number, label }) => (
                <div key={label}>
                  <p className="font-cormorant text-3xl font-bold text-[#4A3328]">{number}</p>
                  <p className="text-xs text-[#8A7D70] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Product showcase image */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden border border-[#EFE4D8] shadow-[0_16px_60px_rgba(74,51,40,0.12)]">
              <img
                src="/aboutus/shopinside2.jpg"
                alt="Bowri Shop product collection — hair accessories"
                className="w-full h-[420px] object-cover"
              />
            </div>
            {/* Floating caption card */}
            <div className="absolute -bottom-5 -left-5 bg-white border border-[#EFE4D8] rounded-2xl shadow-lg px-5 py-4 max-w-[200px]">
              <p className="text-sm font-semibold text-[#4A3328] leading-snug">
                Beautifully curated accessories
              </p>
              <p className="text-xs text-[#C7927E] mt-1">Hair clips & more</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────────── */}
      <section className="bg-[#F7F1EA] border-y border-[#EFE4D8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="text-center mb-12">
            <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#C7927E] mb-3">
              Why Bowri Shop
            </span>
            <h2 className="font-cormorant text-4xl font-bold text-[#4A3328]">
              What we stand for
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-[#EFE4D8] rounded-2xl p-6 hover:shadow-[0_8px_30px_rgba(74,51,40,0.07)] transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-[#F7F1EA] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#C7927E]" />
                </div>
                <h3 className="font-semibold text-[#4A3328] mb-2">{title}</h3>
                <p className="text-sm text-[#8A7D70] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Location + Map ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Info */}
          <div>
            <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#C7927E] mb-3">
              Find us
            </span>
            <h2 className="font-cormorant text-4xl font-bold text-[#4A3328] mb-6 leading-tight">
              Come visit us in Bamundi
            </h2>
            <p className="text-[#8A7D70] leading-relaxed mb-8">
              We're based in Kazipur Road, Bamundi, Bangladesh — and we ship nationwide.
              Have a question or want to visit in person? We'd love to meet you.
            </p>

            <div className="space-y-4">
              <a
                href="https://www.google.com/maps/place/Bowrishop/@23.9034557,88.8012171,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F7F1EA] border border-[#EFE4D8] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C7927E] transition-colors">
                  <MapPin className="w-4 h-4 text-[#C7927E] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-medium text-[#4A3328] group-hover:text-[#C7927E] transition-colors">
                    Kazipur Road, Bamundi 7110
                  </p>
                  <p className="text-sm text-[#8A7D70]">Bangladesh</p>
                </div>
              </a>

              <a
                href="https://www.bowrishop.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F7F1EA] border border-[#EFE4D8] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C7927E] transition-colors">
                  <Globe className="w-4 h-4 text-[#C7927E] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-medium text-[#4A3328] group-hover:text-[#C7927E] transition-colors">
                    www.bowrishop.com
                  </p>
                  <p className="text-sm text-[#8A7D70]">Shop online anytime</p>
                </div>
              </a>
            </div>

            <a
              href="https://www.google.com/maps/dir//Bowrishop,+Kazipur+Rd,+Bamundi+7110/@23.9127149,88.6852606,12.24z"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-[#C7927E] border border-[#C7927E] rounded-full px-5 py-2.5 hover:bg-[#C7927E] hover:text-white transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              Get directions
            </a>
          </div>

          {/* Map embed — styled to match the brand */}
          <div className="rounded-3xl overflow-hidden border border-[#EFE4D8] shadow-[0_8px_40px_rgba(74,51,40,0.10)]">
            <iframe
              title="Bowri Shop Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3639.0!2d88.8012171!3d23.9034557!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39feb3ce10e34367%3A0x657bcccc66056b93!2sBowrishop!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
              width="100%"
              height="420"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="bg-white px-5 py-4 flex items-center justify-between border-t border-[#EFE4D8]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F7F1EA] border border-[#EFE4D8] flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#C7927E]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#4A3328]">Bowri Shop</p>
                  <p className="text-xs text-[#8A7D70]">Kazipur Rd, Bamundi 7110</p>
                </div>
              </div>
              <a
                href="https://www.google.com/maps/place/Bowrishop/@23.9034557,88.8012171,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#C7927E] hover:underline"
              >
                View larger map
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#4A3328]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <h2 className="font-cormorant text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to shop?
          </h2>
          <p className="text-[#D8CEC5] text-lg mb-8">
            Quality products, affordable prices — delivered to your door across Bangladesh.
          </p>
          <Link to="/products">
            <Button className="bg-[#C7927E] hover:bg-[#A97462] text-white rounded-full px-10 py-3 text-base font-semibold">
              Browse All Products
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}