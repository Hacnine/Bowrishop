import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const tag = request.nextUrl.searchParams.get('tag');
  const expectedSecret = process.env.REVALIDATE_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  if (!tag) {
    return NextResponse.json({ error: 'Tag required' }, { status: 400 });
  }

  try {
    if (tag.startsWith('product-')) {
      const slug = tag.slice('product-'.length);
      if (!slug) {
        return NextResponse.json({ error: 'Product slug required' }, { status: 400 });
      }
      revalidateTag(tag); // revalidates all fetches tagged with `product-${slug}`
    }
  } catch (error) {
    console.error('[revalidate] Cache invalidation failed', {
      tag,
      error: error instanceof Error ? error.stack : error,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cache invalidation failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ revalidated: true, tag });
}
