import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const tag = request.nextUrl.searchParams.get('tag');
  const expectedSecret = process.env.REVALIDATE_SECRET;
  const time = new Date().toISOString();

  console.log(`[revalidate] ========== REVALIDATE REQUEST ==========`);
  console.log(`[revalidate] time: ${time}`);
  console.log(`[revalidate] tag: ${tag}`);
  console.log(`[revalidate] secret match: ${secret === expectedSecret}`);
  console.log(`[revalidate] NODE_ENV: ${process.env.NODE_ENV}`);

  if (!expectedSecret || secret !== expectedSecret) {
    console.warn('[revalidate] secret mismatch — rejecting');
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  if (!tag) {
    return NextResponse.json({ error: 'Tag required' }, { status: 400 });
  }

  try {
    console.log(`[revalidate] calling revalidateTag("${tag}") ...`);
    revalidateTag(tag);
    console.log(`[revalidate] revalidateTag DONE — next request will re-fetch`);
    console.log(`[revalidate] =============================================`);
  } catch (error) {
    console.error('[revalidate] revalidateTag threw:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cache invalidation failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ revalidated: true, tag, time });
}