import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ProductDetailPage } from '@/views/products/ProductDetailPage';
import { ProductDetailSkeleton } from '@/views/products/ProductDetailSkeleton';
import type { Product } from '@/types/types.index';

// ISR with tag-based invalidation.
//
// force-static: Next.js renders and caches the page on the server.
// The browser never caches the HTML (next.config.ts sets Cache-Control:
// no-cache on all HTML routes), so after revalidateTag fires the browser
// always gets the freshly rendered page on the next load.
//
// Stale data flow:
//   admin updates product → backend calls /api/revalidate
//   → revalidateTag('product-<slug>') busts the server cache
//   → next browser request gets a fresh server render with new data
export const dynamic = 'force-static';

async function getProduct(slug: string): Promise<Product | null> {
  const backendUrl = process.env.API_URL ?? 'http://backend:3001';
  const url = `${backendUrl}/api/products/${slug}`;
  console.log(`[product-page] fetching: ${url}`);
  try {
    const res = await fetch(url, {
      // Tag this fetch — revalidateTag('product-<slug>') will bust it.
      next: { tags: [`product-${slug}`] },
    });
    console.log(`[product-page] status: ${res.status} slug: ${slug}`);
    if (!res.ok) return null;
    const data = await res.json();
    console.log(`[product-page] got id: ${data?.id} price: ${data?.price}`);
    return data;
  } catch (err) {
    console.error(`[product-page] fetch error for slug "${slug}":`, err);
    return null;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product Not Found | Bowri Shop' };
  return {
    title: `${product.name} | Bowri Shop`,
    description: product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160),
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailPage initialProduct={product} />
    </Suspense>
  );
}