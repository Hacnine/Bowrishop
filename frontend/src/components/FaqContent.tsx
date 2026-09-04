"use client";

import { useState } from "react";
import {
  ChevronDown,
  ShoppingBag,
  CreditCard,
  RotateCcw,
} from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqCategory {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  items: FaqItem[];
}

export const faqCategories: FaqCategory[] = [
  {
    id: "order",
    icon: ShoppingBag,
    title: "অর্ডার ও ডেলিভারি",
    subtitle: "Order & Delivery",
    items: [
      {
        question: "আমি কীভাবে অর্ডার করব?",
        answer:
          'আমাদের ওয়েবসাইটে আপনার পছন্দের প্রোডাক্টটি সিলেক্ট করে "Add to Cart" অথবা "Buy Now" বাটনে ক্লিক করুন। এরপর আপনার নাম, ডেলিভারি অ্যাড্রেস এবং ফোন নাম্বার দিয়ে "Place Order"-এ ক্লিক করলেই আপনার অর্ডারটি কনফার্ম হয়ে যাবে।',
      },
      {
        question: "ডেলিভারি পেতে কতদিন সময় লাগবে?",
        answer:
          "ঢাকা সিটির ভেতরে সাধারণত ৪৮ ঘণ্টার মধ্যে ডেলিভারি দেওয়া হয়। ঢাকা সিটির বাইরে বা জেলা শহরগুলোতে পণ্য পৌঁছাতে ২ থেকে ৪ কার্যদিবস সময় লাগতে পারে।",
      },
      {
        question: "ডেলিভারি চার্জ কত?",
        answer:
          "ঢাকা সিটির ভেতরে ডেলিভারি চার্জ ৮০ টাকা এবং ঢাকা সিটির বাইরে সারা বাংলাদেশে ডেলিভারি চার্জ ১৩৫ টাকা। (দ্রষ্টব্য: প্রমোশন বা অফারের কারণে ডেলিভারি চার্জ পরিবর্তিত হতে পারে।)",
      },
    ],
  },
  {
    id: "payment",
    icon: CreditCard,
    title: "পেমেন্ট ও রিফান্ড",
    subtitle: "Payment & Refund",
    items: [
      {
        question: "আমি কীভাবে পেমেন্ট বা টাকা পরিশোধ করব?",
        answer:
          "আমরা ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা পরিশোধ) সুবিধা দিয়ে থাকি। এছাড়া আপনি বিকাশ, রকেট, নগদ বা যেকোনো ডেবিট/ক্রেডিট কার্ডের মাধ্যমেও অগ্রিম পেমেন্ট করতে পারবেন।",
      },
      {
        question: "বিকাশ বা নগদে পেমেন্ট করার নিয়ম কী?",
        answer:
          'চেকআউট পেজে "Online Payment" অপশনটি সিলেক্ট করলে আপনি বিকাশ, নগদ বা রকেটের গেটওয়ে পেয়ে যাবেন। সেখানে আপনার অ্যাকাউন্ট নাম্বার ও ওটিপি (OTP) দিয়ে খুব সহজেই পেমেন্ট সম্পন্ন করতে পারবেন।',
      },
      {
        question: "আমি কি অর্ডার ক্যানসেল (বাতিল) করতে পারি?",
        answer:
          "হ্যাঁ, পণ্য আমাদের অফিস থেকে ডেলিভারির জন্য বের হওয়ার আগে আপনি যেকোনো সময় কল করে বা মেসেজ দিয়ে অর্ডারটি বাতিল করতে পারবেন। তবে প্রোডাক্ট কুরিয়ারে চলে যাওয়ার পর অর্ডার বাতিল করা সম্ভব নয়।",
      },
    ],
  },
  {
    id: "return",
    icon: RotateCcw,
    title: "রিটার্ন ও এক্সচেঞ্জ",
    subtitle: "Return & Exchange",
    items: [
      {
        question: "ভুল বা নষ্ট (Defective) প্রোডাক্ট পেলে আমার করণীয় কী?",
        answer:
          "ডেলিভারি ম্যান থাকা অবস্থায় দয়া করে প্রোডাক্টটি চেক করে নেবেন। যদি কোনো ভুল বা নষ্ট প্রোডাক্ট পান, তবে ডেলিভারি ম্যানের কাছেই প্রোডাক্টটি রিটার্ন করুন এবং আমাদের কাস্টমার কেয়ারে দ্রুত যোগাযোগ করুন। আমরা সম্পূর্ণ বিনামূল্যে আপনাকে সঠিক প্রোডাক্টটি এক্সচেঞ্জ করে দেব।",
      },
      {
        question: "সাইজ বা কালার পছন্দ না হলে কি পরিবর্তন করা যাবে?",
        answer:
          "হ্যাঁ, প্রোডাক্ট রিসিভ করার ২৪ ঘণ্টার মধ্যে আমাদের জানালে আপনি সাইজ বা কালার এক্সচেঞ্জ করতে পারবেন (যদি স্টক থাকে)। তবে এক্ষেত্রে কুরিয়ার চার্জ কাস্টমারকে বহন করতে হবে। অবশ্যই প্রোডাক্টটি অব্যবহৃত এবং অক্ষত অবস্থায় থাকতে হবে।",
      },
    ],
  },
];

export function FaqSection({ category }: { category: FaqCategory }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const Icon = category.icon;

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
