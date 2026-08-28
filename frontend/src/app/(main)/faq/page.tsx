import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'সাধারণ জিজ্ঞাসা (FAQ) | Bowri Shop',
	description: 'Bowri Shop-এর অর্ডার, ডেলিভারি, পেমেন্ট এবং রিটার্ন সংক্রান্ত সাধারণ প্রশ্নের উত্তর।',
};

export { FaqPage as default } from '@/views/Faq';
