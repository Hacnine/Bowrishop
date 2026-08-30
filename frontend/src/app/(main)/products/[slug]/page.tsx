import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ProductDetailPage } from '@/views/products/ProductDetailPage';
import { ProductDetailSkeleton } from '@/views/products/ProductDetailSkeleton';
import type { Product } from '@/types/types.index';

// SSR — runtime-এ fetch করবে, build time-এ না
export const dynamic = 'force-dynamic';

async function getProduct(slug: string): Promise<Product | null> {
  // API_URL = runtime env var, Docker-এ http://backend:3001
  const backendUrl = process.env.API_URL ?? 'http://backend:3001';
  
  try {
    const res = await fetch(`${backendUrl}/api/products/${slug}`, {
      next: { revalidate: 86400 },
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
