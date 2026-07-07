import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Droplet,
  Droplets,
  Home as HomeIcon,
  Leaf,
  Lightbulb,
  ShieldCheck,
  Feather,
  Sparkles,
  CheckCircle2,
  SprayCan,
  PackageCheck,
  Gift,
  Sofa,
  BedDouble,
  Monitor,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

// ---- Slide content (dynamic: swap/add slides freely) ----
// Each slide carries its own perks (icon/title/desc + colors) plus its
// own bar styling (background, divider) so the perks bar visually matches
// that slide's photo instead of one perk set/style being reused everywhere.
const heroSlides = [
  {
    eyebrow: 'Beauty in every detail',
    title: 'Hair Pins',
    description:
      'Discover our collection of beautifully designed hair pins that add the perfect touch to every look, every occasion.',
    image: '/hero/hero-1.webp',
    link: '/products?categoryId=1',
    objectPosition: 'center center',
    titleClass: 'text-[#4A3328] ',
    descriptionClass: 'text-[#7A6557]',
    eyebrowClass: 'text-[#8B6A56]',
    buttonClass: 'bg-[#C7927E] text-white hover:bg-[#A97462]',
    perksBarClass: 'bg-white/60 backdrop-blur-md border border-white/50',
    perksTitleClass: 'text-[#4A3328]',
    perksDescClass: 'text-[#7A6557]',
    perksDividerClass: 'divide-[#4A3328]/10',
    perks: [
      {
        icon: Sparkles,
        title: 'Elegant Finish',
        desc: 'A polished touch for every hairstyle',
        iconBg: 'bg-white/70',
        iconColor: 'text-[#8B6A56]',
      },
      {
        icon: ShieldCheck,
        title: 'Secure Grip',
        desc: 'Stays perfectly in place all day',
        iconBg: 'bg-white/70',
        iconColor: 'text-[#8B6A56]',
      },
      {
        icon: Feather,
        title: 'Lightweight Feel',
        desc: 'Comfortable with no pulling or tugging',
        iconBg: 'bg-white/70',
        iconColor: 'text-[#8B6A56]',
      },
      {
        icon: CheckCircle2,
        title: 'Versatile Style',
        desc: 'Perfect for every occasion',
        iconBg: 'bg-white/70',
        iconColor: 'text-[#8B6A56]',
      },
    ],
  },
  {
    eyebrow: 'Beauty in every detail',
    title: 'Clip it. Love it. Solve it.',
    description:
      'Trendy hair clips, bands & clever accessories designed to elevate your style and make everyday easier.',
    image: '/hero/hero-2.webp',
    link: '/products?categoryId=2',
    objectPosition: 'center center',
    titleClass: 'text-[#4A3328]',
    descriptionClass: 'text-[#7A6557]',
    eyebrowClass: 'text-[#8B6A56]',
    buttonClass: 'bg-[#C7927E] text-white hover:bg-[#A97462]',
    perksBarClass: 'bg-white/60 backdrop-blur-md border border-white/50',
    perksTitleClass: 'text-[#4A3328]',
    perksDescClass: 'text-[#7A6557]',
    perksDividerClass: 'divide-[#4A3328]/10',
    perks: [
      {
        icon: ShieldCheck,
        title: 'Strong Hold',
        desc: 'All day long',
        iconBg: 'bg-white/70',
        iconColor: 'text-[#8B6A56]',
      },
      {
        icon: Feather,
        title: 'Lightweight',
        desc: 'No pull',
        iconBg: 'bg-white/70',
        iconColor: 'text-[#8B6A56]',
      },
      {
        icon: Sparkles,
        title: 'Stylish Designs',
        desc: 'For every look',
        iconBg: 'bg-white/70',
        iconColor: 'text-[#8B6A56]',
      },
      {
        icon: CheckCircle2,
        title: 'Problem Solving',
        desc: 'Everyday helper',
        iconBg: 'bg-white/70',
        iconColor: 'text-[#8B6A56]',
      },
    ],
  },
  {
    eyebrow: 'Decor that inspires',
    title: 'Light Up Your Space',
    description:
      'Add a touch of magic to your home with this elegant Jellyfish LED Lamp. A perfect blend of art and ambience for any room.',
    image: '/hero/hero-3.webp',
    link: '/products?categoryId=3',
    objectPosition: 'center top',
    titleClass: 'text-[#FFF9F5]',
    descriptionClass: 'text-[#EFE4D8]',
    eyebrowClass: 'text-[#D7A99A]',
    buttonClass: 'bg-[#C9A46A] text-[#4A3328] hover:bg-[#D7A99A]',
    perksBarClass: 'bg-black/20 backdrop-blur-md border border-white/10',
    perksTitleClass: 'text-white',
    perksDescClass: 'text-white/70',
    perksDividerClass: 'divide-white/10',
    perks: [
      {
        icon: Lightbulb,
        title: 'Soft & Warm Glow',
        desc: 'Creates a cozy and relaxing atmosphere',
        iconBg: 'bg-[#C9A46A]',
        iconColor: 'text-white',
      },
      {
        icon: HomeIcon,
        title: 'Perfect Home Decor',
        desc: 'Enhances the beauty of any space',
        iconBg: 'bg-[#C9A46A]',
        iconColor: 'text-white',
      },
      {
        icon: Gift,
        title: 'Great Gift Idea',
        desc: 'A thoughtful gift for loved ones',
        iconBg: 'bg-[#C9A46A]',
        iconColor: 'text-white',
      },
      {
        icon: Leaf,
        title: 'Energy Efficient',
        desc: 'LED light with low power consumption',
        iconBg: 'bg-[#C9A46A]',
        iconColor: 'text-white',
      },
    ],
  },
  {
    eyebrow: 'Smart solutions for a',
    title: 'Smarter, Easier Everyday Life',
    description:
      'Thoughtfully designed items that solve everyday problems and make your home life more convenient.',
    image: '/hero/hero-4.webp',
    link: '/products?featured=true',
    objectPosition: 'center center',
    titleClass: 'text-[#4A3328]',
    descriptionClass: 'text-gray-500',
    eyebrowClass: 'text-gray-500',
    buttonClass: 'bg-[#C7927E] text-white hover:bg-[#A97462]',
    perksBarClass: 'bg-white/85 backdrop-blur-sm border border-gray-200',
    perksTitleClass: 'text-gray-900',
    perksDescClass: 'text-gray-500',
    perksDividerClass: 'divide-gray-200',
    perks: [
      {
        icon: Droplets,
        title: 'Waterproof & Leak Proof',
        desc: 'Strong adhesion, effective protection',
        iconBg: 'bg-[#C7927E]',
        iconColor: 'text-white',
      },
      {
        icon: SprayCan,
        title: 'Controlled Pouring',
        desc: 'No drips, no waste, easy to use',
        iconBg: 'bg-[#C9A46A]',
        iconColor: 'text-white',
      },
      {
        icon: PackageCheck,
        title: 'Seal It Fresh',
        desc: 'Keep food fresh and prevent moisture',
        iconBg: 'bg-[#7C9A6D]',
        iconColor: 'text-white',
      },
      {
        icon: ShieldCheck,
        title: 'Durable & Reliable',
        desc: 'Quality materials for long-lasting use',
        iconBg: 'bg-[#C7927E]',
        iconColor: 'text-white',
      },
    ],
  },
  {
    eyebrow: 'Beauty in every detail',
    title: 'Decor That Feels Like Home',
    description:
      'Add charm and comfort to your space with our adorable House Humidifier. A perfect blend of style, function, and relaxation.',
    image: '/hero/hero-5.webp',
    link: '/products?sale=true',
    objectPosition: 'center center',
    titleClass: 'text-[#FFF9F5]',
    descriptionClass: 'text-[#EFE4D8]',
    eyebrowClass: 'text-[#D7A99A]',
    buttonClass: 'bg-[#D7A99A] text-[#4A3328] hover:bg-[#C7927E]',
    perksBarClass: 'bg-black/30 backdrop-blur-md',
    perksTitleClass: 'text-white',
    perksDescClass: 'text-white/70',
    perksDividerClass: 'divide-white/15',
    perks: [
      {
        icon: Droplet,
        title: 'Soothing Mist',
        desc: 'Creates a calm and relaxing atmosphere',
        iconBg: 'bg-[#D7A99A]',
        iconColor: 'text-[#4A3328]',
      },
      {
        icon: HomeIcon,
        title: 'Cute & Elegant Design',
        desc: 'Enhances the beauty of any room',
        iconBg: 'bg-[#D7A99A]',
        iconColor: 'text-[#4A3328]',
      },
      {
        icon: Leaf,
        title: 'Purifies & Freshens Air',
        desc: 'Improves air quality for better living',
        iconBg: 'bg-[#D7A99A]',
        iconColor: 'text-[#4A3328]',
      },
      {
        icon: Lightbulb,
        title: 'Warm Night Light',
        desc: 'Soft glow for peaceful and cozy nights',
        iconBg: 'bg-[#D7A99A]',
        iconColor: 'text-[#4A3328]',
      },
    ],
  },
];

// ---- Icon matcher for the category strip below the hero ----
const categoryIconRules = [
  { match: /living/i, icon: Sofa },
  { match: /bed/i, icon: BedDouble },
  { match: /study|office|desk/i, icon: Monitor },
  { match: /gift|decor/i, icon: Gift },
];

function getCategoryIcon(name = '') {
  const found = categoryIconRules.find(({ match }) => match.test(name));
  return found ? found.icon : Gift;
}

const AUTOPLAY_MS = 6000;

/**
 * Renders a slide's perks as a bottom overlay bar. Colors (bar background,
 * divider, icon circle, text) all come from the slide/perk config so each
 * slide's bar matches its own photo instead of sharing one hardcoded look.
 */
function Perks({ slide }) {
  if (!slide.perks?.length) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 px-4 sm:px-6 lg:px-8 pb-6">
      <div
        className={`max-w-6xl mx-auto rounded-2xl grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 ${
          slide.perksDividerClass ?? 'divide-white/15'
        } ${slide.perksBarClass ?? 'bg-black/30 backdrop-blur-md'}`}
      >
        {slide.perks.map(({ icon: Icon, title, desc, iconBg, iconColor }) => (
          <div key={title} className="flex items-center gap-3 px-5 py-4">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <div className={`text-sm font-semibold leading-snug  ${slide.perksTitleClass}`}>
                {title}
              </div>
              <div className={`text-xs leading-snug ${slide.perksDescClass}`}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Hero section: autoplaying slider + per-slide perks bar + category icon strip.
 * @param {{ categories?: Array<{ id: string|number, name: string }> }} props
 */
export function Hero({ categories = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroSlides.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(interval);
  }, []);

  const slide = heroSlides[activeIndex];

  return (
    <section className="relative">
      {/* Hero image with text + perks */}
      <div className="relative text-white h-[550px] lg:h-[650px] overflow-hidden">
        {/* Background slider */}
        <div className="absolute inset-0">
          {heroSlides.map((s, index) => (
            <Link
              key={s.title}
              to={s.link}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
              }`}
            >
              <img
                src={s.image}
                alt={s.title}
                className="h-full w-full object-cover"
                style={{ objectPosition: s.objectPosition }}
              />
            </Link>
          ))}
        </div>

        {/* Text content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center pb-28">
          <div className="max-w-xl space-y-5">
            <span
              className={`block uppercase tracking-[0.2em] text-xs font-semibold ${slide.eyebrowClass}`}
            >
              {slide.eyebrow}
            </span>

            <span className="block w-10 h-[2px] bg-current opacity-70" />

            <h1
              className={`${slide.titleClass} text-5xl lg:text-6xl font-cormorant font-bold leading-tight`}
            >
              {slide.title}
            </h1>

            <p className={`${slide.descriptionClass} text-base lg:text-lg max-w-md`}>
              {slide.description}
            </p>

            <Button
              asChild
              size="lg"
              className={`${slide.buttonClass} rounded-full font-semibold tracking-wide mt-2`}
            >
              <Link to={slide.link}>
                Shop Now
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Slider dots */}
        <div className="absolute inset-x-0 bottom-[120px] flex justify-center gap-3 z-30">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                index === activeIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>

        {/* Perks overlay bar */}
        <Perks slide={slide} />
      </div>

      {/* Category icon strip (below hero) */}
      {categories.length > 0 && (
        <div className="bg-[#F7F1EA] border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              return (
                <Link
                  key={cat.id}
                  to={`/products?categoryId=${cat.id}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold tracking-wide uppercase">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
