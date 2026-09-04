"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const reviewScreenshots = [
  { src: "/reviews/review-1.png", label: "Customer review" },
  { src: "/reviews/review-2.png", label: "Customer review" },
  { src: "/reviews/review-3.png", label: "Customer review" },
  { src: "/reviews/review-4.png", label: "Customer review" },
];

function ReviewScreenshot({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center bg-[#F7F1EA] px-8 text-center">
        <MessageCircle className="mb-4 h-10 w-10 text-[#C7927E]" />
        <p className="text-sm font-medium text-[#4A3328]">Facebook review screenshot</p>
        <p className="mt-2 text-xs text-[#8A7D70]">Add the screenshot at {src}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={label}
      className="h-full min-h-[320px] w-full object-contain bg-[#F7F1EA]"
      onError={() => setFailed(true)}
    />
  );
}

export function FacebookReviewSlider() {
  return (
    <div className="relative">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation={{ prevEl: ".review-prev", nextEl: ".review-next" }}
        spaceBetween={20}
        breakpoints={{
          0: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1100: { slidesPerView: 3 },
        }}
        className="!pb-12"
      >
        {reviewScreenshots.map((review) => (
          <SwiperSlide key={review.src}>
            <div className="overflow-hidden rounded-2xl border border-[#EFE4D8] bg-white shadow-[0_8px_30px_rgba(74,51,40,0.08)]">
              <ReviewScreenshot {...review} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <button type="button" aria-label="Previous review" className="review-prev absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[#4A3328] shadow-md transition hover:bg-white md:-left-4">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button type="button" aria-label="Next review" className="review-next absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[#4A3328] shadow-md transition hover:bg-white md:-right-4">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
