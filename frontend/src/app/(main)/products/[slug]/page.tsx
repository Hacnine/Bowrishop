import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ProductDetailPage } from '@/views/ProductDetailPage';
import type { Product } from '@/types/types.index';

export const revalidate = 300;

function getApiUrl(path: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const baseUrl = configuredUrl.endsWith('/api') ? configuredUrl : `${configuredUrl}/api`;
  return `${baseUrl}${path}`;
}

async function getProducts() {
  try {
    const response = await fetch(getApiUrl('/products?page=1&limit=100'), { cache: 'force-cache' });
    if (!response.ok) return [];
    const body = (await response.json()) as { products?: Product[] };
    return body.products ?? [];
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

async function getProduct(slug: string) {
  try {
    const response = await fetch(getApiUrl(`/products/${encodeURIComponent(slug)}`), {
      next: { revalidate: 300 },
    });
    if (!response.ok) return undefined;
    return (await response.json()) as Product;
  } catch {
    return undefined;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: 'Product Not Found | Bowri Shop' };
  }

  return {
    title: `${product.name} | Bowri Shop`,
    description: product.description,
    alternates: { canonical: `https://www.bowrishop.com/products/${product.slug}` },
    openGraph: {
      title: `${product.name} | Bowri Shop`,
      description: product.description,
      images: product.images[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  return (
    <Suspense fallback={<div className="p-6">Loading product...</div>}>
      <ProductDetailPage initialProduct={product} />
    </Suspense>
  );
}
