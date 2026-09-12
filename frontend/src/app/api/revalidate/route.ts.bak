import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const tag = request.nextUrl.searchParams.get('tag');
  const expectedSecret = process.env.REVALIDATE_SECRET;

  console.log(`[revalidate] received POST, tag: ${tag}`);

  if (!expectedSecret || secret !== expectedSecret) {
    console.warn('[revalidate] secret mismatch');
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  if (!tag) {
    return NextResponse.json({ error: 'Tag required' }, { status: 400 });
  }

  try {
    console.log(`[revalidate] calling revalidateTag("${tag}")`);
    revalidateTag(tag);
    console.log(`[revalidate] revalidateTag done for "${tag}"`);
  } catch (error) {
    console.error('[revalidate] revalidateTag threw:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cache invalidation failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ revalidated: true, tag });
}