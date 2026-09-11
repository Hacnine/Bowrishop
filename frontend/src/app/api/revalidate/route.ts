import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

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

  revalidateTag(tag);
  if (tag.startsWith('product-')) {
    const slug = tag.slice('product-'.length);
    if (!slug) {
      return NextResponse.json({ error: 'Product slug required' }, { status: 400 });
    }
    revalidatePath(`/products/${slug}`);
  }

  return NextResponse.json({ revalidated: true, tag });
}