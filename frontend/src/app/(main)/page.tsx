import type { Metadata } from 'next';
import { HomePage } from '@/views/HomePage';
import type { Category } from '@/types/types.index';

export const metadata: Metadata = {
	title: 'Bowri Shop | Home, Kitchen, Beauty, Electronics, Clothing & Footwear',
	description: 'Shop home essentials, kitchenware, beauty products, electronics, clothing, footwear and more at Bowri Shop. Fast delivery across Bangladesh.',
	openGraph: {
		title: 'Bowri Shop | Home, Kitchen, Beauty, Electronics',
		description: 'Shop home essentials, kitchenware, beauty products and more at Bowri Shop.',
		url: 'https://www.bowrishop.com',
		siteName: 'Bowri Shop',
		type: 'website',
	},
};

export const dynamic = 'force-dynamic';

async function getCategories(): Promise<Category[]> {
	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
		const base = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
		const res = await fetch(`${base}/categories`, { cache: 'no-store' });
		if (!res.ok) return [];
		return res.json();
	} catch {
		return [];
	}
}

export default async function Page() {
	const categories = await getCategories();
	return <HomePage categories={categories} />;
}
