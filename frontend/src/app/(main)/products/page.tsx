import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ProductDetailPage } from '@/views/products/ProductDetailPage';
import { ProductDetailSkeleton } from '@/views/products/ProductDetailSkeleton';
import type { Product } from '@/types/types.index';

// force-dynamic: render on every request, never statically cache the HTML.
// This is required because force-static sets Cache-Control: max-age=31536000
// on the response, meaning browsers serve the old page for a year even after
// revalidateTag fires on the server.
//
// The fetch() inside getProduct still uses next: { tags } so the backend call
// is cached in Next.js's server-side fetch cache and only re-runs when
// revalidateTag('product-<slug>') is called by /api/revalidate.
export const dynamic = 'force-dynamic';

async function getProduct(slug: string): Promise<Product | null> {
  const backendUrl = process.env.API_URL ?? 'http://backend:3001';
  const url = `${backendUrl}/api/products/${slug}`;

  console.log(`[product-page] fetching: ${url}`);

  try {
    const res = await fetch(url, {
      next: { tags: [`product-${slug}`] },
    });

    console.log(`[product-page] response status: ${res.status} for slug: ${slug}`);

    if (!res.ok) return null;
    const data = await res.json();
    console.log(`[product-page] fetched product id: ${data?.id}, price: ${data?.price}`);
    return data;
  } catch (err) {
    console.error(`[product-page] fetch error for slug ${slug}:`, err);
    return null;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  // Next.js deduplicates identical fetch() calls within one render pass —
  // this does NOT make a second HTTP request to the backend.
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