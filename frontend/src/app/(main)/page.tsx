import type { Metadata } from 'next';
import type { Category, Product } from '@/types/types.index';
import { HomePage } from '@/views/HomePage';

export const metadata: Metadata = {
	title: 'Bowri Shop | Home, Kitchen, Beauty, Electronics, Clothing & Footwear',
	description: 'Shop home essentials, kitchenware, beauty products, electronics, clothing, footwear and more at Bowri Shop. Fast delivery across Bangladesh.',
};

function getApiUrl(path: string) {
	const configuredUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
	const baseUrl = configuredUrl.endsWith('/api') ? configuredUrl : `${configuredUrl}/api`;
	return `${baseUrl}${path}`;
}

async function getHomeData() {
	const endpoints = [
		['categories', '/categories'],
		['featured', '/products/featured?limit=10'],
		['bestSelling', '/products/best-selling?limit=10'],
		['onSale', '/products/on-sale?limit=10'],
		['newArrivals', '/products/new-arrivals?limit=10'],
		['mostViewed', '/products/most-viewed?limit=10'],
	] as const;

	const entries = await Promise.all(
		endpoints.map(async ([key, path]) => {
			try {
				const response = await fetch(getApiUrl(path), { next: { revalidate: 300 } });
				return [key, response.ok ? await response.json() : undefined] as const;
			} catch {
				return [key, undefined] as const;
			}
		}),
	);

	return Object.fromEntries(entries) as {
		categories?: Category[];
		featured?: Product[];
		bestSelling?: Product[];
		onSale?: Product[];
		newArrivals?: Product[];
		mostViewed?: Product[];
	};
}

export default async function Page() {
	const initialData = await getHomeData();
	return <HomePage {...initialData} />;
}
