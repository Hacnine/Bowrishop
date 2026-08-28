import { Shield, Info, Share2, Cookie, UserCheck, RefreshCw, Mail, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: 'collect',
    icon: Info,
    title: '১. আমরা কী কী তথ্য সংগ্রহ করি?',
    content: (
      <>
        <p className="text-[#8A7D70] leading-relaxed mb-4">
          আপনার অর্ডার সঠিকভাবে প্রসেস করার জন্য আমরা কিছু প্রয়োজনীয় তথ্য সংগ্রহ করি, যেমন:
        </p>
        <div className="space-y-3">
          {[
            {
              label: 'ব্যক্তিগত তথ্য',
              desc: 'আপনার নাম, ডেলিভারি ঠিকানা, ইমেইল অ্যাড্রেস এবং ফোন নম্বর (যা আপনি অর্ডার করার সময় বা অ্যাকাউন্ট খোলার সময় প্রদান করেন)।',
            },
            {
              label: 'পেমেন্ট তথ্য',
              desc: 'আপনার পেমেন্ট মেথড (বিকাশ, রকেট, নগদ বা কার্ড)। তবে আমরা আপনার কোনো কার্ড পিন (PIN) বা পাসওয়ার্ড সংরক্ষণ করি না; এগুলো সম্পূর্ণ নিরাপদ থার্ড-পার্টি পেমেন্ট গেটওয়ের মাধ্যমে প্রসেস হয়।',
            },
            {
              label: 'টেকনিক্যাল তথ্য',
              desc: 'আপনার আইপি (IP) অ্যাড্রেস, ব্রাউজারের ধরন এবং আমাদের সাইটে আপনার ব্রাউজিং অ্যাক্টিভিটি (কুকিজের মাধ্যমে)।',
            },
          ].map(({ label, desc }) => (
            <div key={label} className="flex gap-3 p-4 bg-[#F7F1EA] rounded-xl border border-[#EFE4D8]">
              <span className="w-2 h-2 rounded-full bg-[#C7927E] flex-shrink-0 mt-2" />
              <div>
                <p className="text-sm font-semibold text-[#4A3328] mb-1">{label}</p>
                <p className="text-sm text-[#8A7D70] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'use',
    icon: UserCheck,
    title: '২. আপনার তথ্য আমরা কীভাবে ব্যবহার করি?',
    content: (
      <>
        <p className="text-[#8A7D70] leading-relaxed mb-4">
          সংগৃহীত তথ্যগুলো আমরা প্রধানত নিম্নলিখিত কাজে ব্যবহার করি:
        </p>
        <ul className="space-y-3">
          {[
            'আপনার অর্ডার নিশ্চিত করতে এবং সঠিক ঠিকানায় পণ্য ডেলিভারি দিতে।',
            'অর্ডার সংক্রান্ত যেকোনো আপডেট জানাতে বা আপনার সাথে যোগাযোগ করতে।',
            'আমাদের কাস্টমার সার্ভিস আরও উন্নত করতে।',
            'কোনো বিশেষ অফার, ডিসকাউন্ট বা নতুন পণ্যের খবর ইমেইল বা এসএমএস (SMS)-এর মাধ্যমে জানাতে (আপনি চাইলে যেকোনো সময় এটি বন্ধ করতে পারবেন)।',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-[#8A7D70] leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C7927E]/10 text-[#C7927E] font-bold text-xs flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'sharing',
    icon: Share2,
    title: '৩. তথ্য শেয়ারিং এবং নিরাপত্তা',
    content: (
      <div className="space-y-4">
        <div className="p-5 bg-[#F7F1EA] rounded-xl border border-[#EFE4D8]">
          <p className="text-sm font-semibold text-[#4A3328] mb-2">তৃতীয় পক্ষের সাথে তথ্য শেয়ার</p>
          <p className="text-sm text-[#8A7D70] leading-relaxed">
            আমরা আপনার কোনো ব্যক্তিগত তথ্য কোনো বাইরের কোম্পানির কাছে বিক্রি বা বাণিজ্যিক উদ্দেশ্যে শেয়ার করি না। তবে অর্ডার ডেলিভারির স্বার্থে কুরিয়ার কোম্পানি এবং পেমেন্ট প্রসেস করার জন্য পেমেন্ট গেটওয়ে পার্টনারদের সাথে প্রয়োজনীয় তথ্য (যেমন: নাম, ঠিকানা, ফোন নম্বর) শেয়ার করা হয়।
          </p>
        </div>
        <div className="p-5 bg-green-50 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-600" />
            <p className="text-sm font-semibold text-green-800">তথ্য সুরক্ষা</p>
          </div>
          <p className="text-sm text-green-700 leading-relaxed">
            আপনার তথ্যের নিরাপত্তা নিশ্চিত করতে আমরা যথাসাধ্য প্রযুক্তিগত ও প্রাতিষ্ঠানিক নিরাপত্তা ব্যবস্থা গ্রহণ করে থাকি (যেমন: SSL এনক্রিপশন)।
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'cookies',
    icon: Cookie,
    title: '৪. কুকিজ (Cookies)-এর ব্যবহার',
    content: (
      <p className="text-[#8A7D70] leading-relaxed">
        আমাদের ওয়েবসাইটে আপনার ব্রাউজিং অভিজ্ঞতা আরও সহজ ও উন্নত করতে আমরা 'কুকিজ' ব্যবহার করি। কুকিজ হলো ছোট ফাইল যা আপনার ব্রাউজারে সংরক্ষিত থাকে এবং আপনাকে পরবর্তীতে দ্রুত সাইট লোড করতে সাহায্য করে। আপনি চাইলে আপনার ব্রাউজার সেটিংস থেকে কুকিজ ডিজেবল (বন্ধ) করে দিতে পারেন, তবে এতে সাইটের কিছু ফিচার কাজ নাও করতে পারে।
      </p>
    ),
  },
  {
    id: 'rights',
    icon: UserCheck,
    title: '৫. আপনার অধিকার',
    content: (
      <p className="text-[#8A7D70] leading-relaxed">
        আপনার প্রদান করা যেকোনো তথ্য পরিবর্তন, পরিমার্জন বা আমাদের ডাটাবেজ থেকে সম্পূর্ণ মুছে ফেলার (Delete) জন্য আপনি যেকোনো সময় আমাদের সাথে যোগাযোগ করার অধিকার রাখেন।
      </p>
    ),
  },
  {
    id: 'changes',
    icon: RefreshCw,
    title: '৬. গোপনীয়তা নীতির পরিবর্তন',
    content: (
      <p className="text-[#8A7D70] leading-relaxed">
        Bowrishop যেকোনো সময় এই গোপনীয়তা নীতি পরিবর্তন বা আপডেট করার অধিকার সংরক্ষণ করে। নীতিতে কোনো বড় পরিবর্তন আনা হলে তা এই পেজেই আপডেট করে দেওয়া হবে।
      </p>
    ),
  },
];

export function PrivacyPolicyPage() {
  return (
    <>
      <SEO
        title="গোপনীয়তা নীতি | Bowri Shop"
        description="Bowri Shop-এর গোপনীয়তা নীতি — আমরা আপনার তথ্য কীভাবে সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখি।"
        canonical="https://www.bowrishop.com/privacy-policy"
      />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="bg-[#F7F1EA] border-b border-[#EFE4D8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#C7927E]/10 border border-[#EFE4D8] flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-[#C7927E]" />
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#C7927E]">
                Legal
              </span>
              <h1 className="font-cormorant text-3xl lg:text-4xl font-bold text-[#4A3328]">
                গোপনীয়তা নীতি
              </h1>
            </div>
          </div>
          <p className="text-[#8A7D70] leading-relaxed max-w-2xl">
            Bowrishop-এ আপনার আস্থা আমাদের কাছে অত্যন্ত মূল্যবান। আমাদের ওয়েবসাইট{' '}
            <a
              href="https://bowrishop.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C7927E] hover:underline inline-flex items-center gap-0.5"
            >
              bowrishop.com <ExternalLink className="w-3 h-3" />
            </a>{' '}
            ব্যবহার করার সময় আপনার ব্যক্তিগত তথ্য আমরা কীভাবে সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখি,
            তা এই গোপনীয়তা নীতির মাধ্যমে প্রকাশ করা হলো। আমাদের সাইটটি ব্যবহার করার মাধ্যমে
            আপনি এই নীতির শর্তাবলীতে সম্মতি প্রকাশ করছেন।
          </p>
          <p className="text-xs text-[#B3A69A] mt-4">
            সর্বশেষ আপডেট: জুলাই ২০২৬
          </p>
        </div>
      </section>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 items-start">

          {/* Sticky sidebar TOC */}
          <aside className="hidden lg:block sticky top-24">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8A7D70] mb-3">
              বিষয়সূচি
            </p>
            <nav className="space-y-1">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#8A7D70] rounded-lg hover:bg-[#F7F1EA] hover:text-[#4A3328] transition-colors group"
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0 text-[#C7927E] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="leading-snug line-clamp-1">
                      {s.title.replace(/^[০-৯]+\.\s*/, '')}
                    </span>
                  </a>
                );
              })}
            </nav>
          </aside>

          {/* Main sections */}
          <div className="space-y-10">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <section
                  key={s.id}
                  id={s.id}
                  className="bg-white border border-[#EFE4D8] rounded-2xl p-6 lg:p-8 scroll-mt-24"
                >
                  <div className="flex items-center gap-3 mb-5 pb-5 border-b border-[#F7F1EA]">
                    <div className="w-9 h-9 rounded-xl bg-[#F7F1EA] border border-[#EFE4D8] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#C7927E]" />
                    </div>
                    <h2 className="font-semibold text-[#4A3328] text-lg leading-snug">
                      {s.title}
                    </h2>
                  </div>
                  {s.content}
                </section>
              );
            })}

            {/* Contact section */}
            <section
              id="contact"
              className="bg-[#4A3328] rounded-2xl p-6 lg:p-8"
            >
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/10">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-[#D7A99A]" />
                </div>
                <h2 className="font-semibold text-white text-lg">যোগাযোগ</h2>
              </div>
              <p className="text-[#D8CEC5] text-sm leading-relaxed mb-6">
                এই গোপনীয়তা নীতি নিয়ে আপনার কোনো প্রশ্ন বা অভিযোগ থাকলে,
                দয়া করে আমাদের সাথে যোগাযোগ করুন:
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:support@bowrishop.com"
                  className="flex items-center gap-3 text-sm text-[#D7A99A] hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  support@bowrishop.com
                </a>
                <a
                  href="https://www.facebook.com/bowrishop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-[#D7A99A] hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  Facebook পেজ
                </a>
              </div>
              <div className="mt-6 pt-5 border-t border-white/10">
                <Link
                  to="/faq"
                  className="inline-flex items-center gap-2 text-sm text-[#D7A99A] hover:text-white transition-colors"
                >
                  সাধারণ জিজ্ঞাসা (FAQ) দেখুন →
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}