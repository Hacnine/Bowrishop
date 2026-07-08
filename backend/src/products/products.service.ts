import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const { q, categoryId, minPrice, maxPrice, minRating, inStock, sort, page = 1, limit = 12 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { tags: { has: q } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? { price: { ...(minPrice !== undefined && { gte: minPrice }), ...(maxPrice !== undefined && { lte: maxPrice }) } }
        : {}),
      ...(inStock && { stock: { gt: 0 } }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === 'price_asc' ? { price: 'asc' }
      : sort === 'price_desc' ? { price: 'desc' }
      : { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          reviews: { select: { rating: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const enriched = products.map((p) => ({
      ...p,
      averageRating: p.reviews.length
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
        : 0,
      reviewCount: p.reviews.length,
      reviews: undefined,
    }));

    // Filter by minRating after aggregation
    const filtered = minRating
      ? enriched.filter((p) => p.averageRating >= minRating)
      : enriched;

    return { products: filtered, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string, sessionId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Record view fire-and-forget (never block the response)
    if (sessionId) {
      this.prisma.productView.create({
        data: { productId: product.id, sessionId },
      }).catch(() => {}); // silently ignore duplicates or errors
    }

    const averageRating = product.reviews.length
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

    return { ...product, averageRating, reviewCount: product.reviews.length };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: { ...dto } });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);
    return this.prisma.product.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async getFeatured(limit = 8) {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true, slug: true } }, reviews: { select: { rating: true } } },
    });
    return products.map((p) => ({
      ...p,
      averageRating: p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0,
      reviewCount: p.reviews.length,
      reviews: undefined,
    }));
  }

  private enrich(products: any[]) {
    return products.map((p) => ({
      ...p,
      averageRating: p.reviews?.length
        ? p.reviews.reduce((s: number, r: any) => s + r.rating, 0) / p.reviews.length
        : 0,
      reviewCount: p.reviews?.length ?? 0,
      reviews: undefined,
    }));
  }

  async getBestSelling(limit = 10) {
    // Products ordered most frequently → rank by total quantity sold via OrderItem
    const topItems = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    if (!topItems.length) {
      // Fallback: newest active products when no orders exist yet
      return this.getFeatured(limit);
    }

    const ids = topItems.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, isActive: true, stock: { gt: 0 } },
      include: { category: { select: { name: true, slug: true } }, reviews: { select: { rating: true } } },
    });

    // Preserve the best-selling order
    const sorted = ids
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);

    return this.enrich(sorted);
  }

  async getOnSale(limit = 10) {
    // Products that have a comparePrice higher than price (i.e. discounted)
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        comparePrice: { not: null },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true, slug: true } }, reviews: { select: { rating: true } } },
    });

    // Filter in JS: comparePrice must be strictly greater than price
    const onSale = products.filter(
      (p) => p.comparePrice && Number(p.comparePrice) > Number(p.price),
    );

    return this.enrich(onSale);
  }

  async getNewArrivals(limit = 10) {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true, slug: true } }, reviews: { select: { rating: true } } },
    });
    return this.enrich(products);
  }

  async getMostViewed(limit = 10) {
    // Aggregate view counts from ProductView table, last 30 days for relevance
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const topViewed = await this.prisma.productView.groupBy({
      by: ['productId'],
      where: { viewedAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    if (!topViewed.length) {
      // Fallback: best selling when no view data yet
      return this.getBestSelling(limit);
    }

    const ids = topViewed.map((v) => v.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, isActive: true, stock: { gt: 0 } },
      include: { category: { select: { name: true, slug: true } }, reviews: { select: { rating: true } } },
    });

    // Preserve view-count order
    const sorted = ids
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);

    return this.enrich(sorted);
  }
}

