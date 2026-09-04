"use client";

import { useState } from "react";
import { ChevronDown, CreditCard, RotateCcw, ShoppingBag } from "lucide-react";
import type { FaqCategory } from "@/data/faqData";

export function FaqSection({ category }: { category: FaqCategory }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const Icon = {
    "shopping-bag": ShoppingBag,
    "credit-card": CreditCard,
    "rotate-ccw": RotateCcw,
  }[category.icon];

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#F7F1EA] border border-[#EFE4D8] flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#C7927E]" />
        </div>
        <div>
          <h2 className="font-semibold text-[#4A3328] leading-tight">{category.title}</h2>
          <p className="text-xs text-[#8A7D70]">{category.subtitle}</p>
        </div>
      </div>

      <div className="space-y-3">
        {category.items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={item.question}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                isOpen
                  ? "border-[#C7927E] shadow-[0_4px_20px_rgba(199,146,126,0.12)]"
                  : "border-[#EFE4D8] hover:border-[#D7A99A]"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white"
              >
                <span className={`text-base font-medium leading-snug transition-colors ${isOpen ? "text-[#C7927E]" : "text-[#4A3328]"}`}>
                  {item.question}
                </span>
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? "bg-[#C7927E] rotate-180" : "bg-[#F7F1EA]"}`}>
                  <ChevronDown className={`w-4 h-4 ${isOpen ? "text-white" : "text-[#8A7D70]"}`} />
                </span>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96" : "max-h-0"}`}>
                <p className="px-6 pb-6 text-[#8A7D70] leading-relaxed text-sm border-t border-[#F7F1EA] pt-4">
                  {item.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
