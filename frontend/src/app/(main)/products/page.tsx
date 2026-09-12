import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ProductDetailPage } from '@/views/products/ProductDetailPage';
import { ProductDetailSkeleton } from '@/views/products/ProductDetailSkeleton';
import type { Product } from '@/types/types.index';

// Do NOT use force-static here.
// force-static causes Next.js to set Cache-Control: max-age=31536000 on the
// HTML response, so browsers serve the stale page even after revalidateTag
// fires on the server. Instead, we use tag-based on-demand ISR: the page is
// cached on the server only (no browser/CDN caching via next.config headers),
// and the cache entry is busted whenever the backend calls /api/revalidate.
export const dynamic = 'force-dynamic'; // never pre-render at build time
export const fetchCache = 'default-cache'; // still allow fetch() to be cached server-side

async function getProduct(slug: string): Promise<Product | null> {
  const backendUrl = process.env.API_URL ?? 'http://backend:3001';
  try {
    const res = await fetch(`${backendUrl}/api/products/${slug}`, {
      // Tag this fetch so revalidateTag('product-<slug>') busts it.
      next: { tags: [`product-${slug}`] },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  // Next.js dedupes identical fetch() calls within a single render pass,
  // so this does NOT cause a second HTTP request to the backend.
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