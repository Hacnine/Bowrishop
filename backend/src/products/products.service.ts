import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminProductQueryDto, CreateProductDto, UpdateProductDto, ProductQueryDto,
  CreateVariantDto, UpdateVariantDto,
} from './dto/product.dto';

const VARIANT_SELECT = {
  id: true,
  color: true,
  colorHex: true,
  size: true,
  price: true,
  comparePrice: true,
  stock: true,
  images: true,
  sku: true,
  isActive: true,
};

const PRODUCT_WITH_VARIANTS = {
  category: { select: { id: true, name: true, slug: true } },
  variants: { where: { isActive: true }, select: VARIANT_SELECT, orderBy: [{ color: 'asc' as const }, { size: 'asc' as const }] },
  _count: { select: { reviews: true } },
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeSearch(value?: string) {
  const normalized = value?.trim().toLocaleLowerCase();
  return normalized ? normalized : undefined;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ─── Product CRUD ────────────────────────────────────────────────────────────

  async create(dto: CreateProductDto) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('A product with this name already exists');

    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        price: dto.price,
        comparePrice: dto.comparePrice,
        stock: dto.stock,
        images: dto.images,
        tags: dto.tags ?? [],
        categoryId: dto.categoryId,
        isActive: dto.isActive ?? true,
        variants: dto.variants?.length
          ? { create: dto.variants.map((v) => ({ ...v, images: v.images ?? [] })) }
          : undefined,
      },
      include: PRODUCT_WITH_VARIANTS,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    const data: any = { ...dto };
    if (dto.name) data.slug = slugify(dto.name);

    return this.prisma.product.update({
      where: { id },
      data,
      include: PRODUCT_WITH_VARIANTS,
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.product.delete({ where: { id } });
  }

  async findAll(query: ProductQueryDto) {
    const page = parseInt(query.page ?? '1');
    const limit = parseInt(query.limit ?? '12');
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    const search = normalizeSearch(query.search ?? query.q);

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.category) {
      where.category = { slug: { equals: normalizeSearch(query.category), mode: 'insensitive' } };
    }
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = parseFloat(query.minPrice);
      if (query.maxPrice) where.price.lte = parseFloat(query.maxPrice);
    }
    if (query.featured === 'true') where.isFeatured = true;
    if (query.sale === 'true') where.comparePrice = { not: null };

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'price_asc') orderBy = { price: 'asc' };
    if (query.sort === 'price_desc') orderBy = { price: 'desc' };
    if (query.sort === 'name_asc') orderBy = { name: 'asc' };
    if (query.sort === 'popular') orderBy = { reviews: { _count: 'desc' } };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where, skip, take: limit, orderBy,
        include: PRODUCT_WITH_VARIANTS,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async searchAdminProducts(query: AdminProductQueryDto) {
    const page = parseInt(query.page ?? '1');
    const limit = parseInt(query.limit ?? '15');
    const skip = (page - 1) * limit;
    const q = normalizeSearch(query.q);

    const where: any = q
      ? { name: { contains: q, mode: 'insensitive' } }
      : {};

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: PRODUCT_WITH_VARIANTS,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string, sessionId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        ...PRODUCT_WITH_VARIANTS,
        // include ALL variants (incl inactive) for admin, only active for storefront
        variants: {
          select: VARIANT_SELECT,
          orderBy: [{ color: 'asc' }, { size: 'asc' }],
        },
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Track view
    if (sessionId) {
      this.prisma.productView.upsert({
        where: { productId_sessionId: { productId: product.id, sessionId } } as any,
        update: { viewedAt: new Date() },
        create: { productId: product.id, sessionId },
      }).catch(() => {});
    }

    const avgRating = product.reviews.length
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

    return { ...product, averageRating: avgRating, reviewCount: product.reviews.length };
  }

  async getFeatured(limit = 8) {
    return this.prisma.product.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: PRODUCT_WITH_VARIANTS,
    });
  }

  async getBestSelling(limit = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
    const ids = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: PRODUCT_WITH_VARIANTS,
    });
    return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  }

  async getOnSale(limit = 10) {
    return this.prisma.product.findMany({
      where: { isActive: true, comparePrice: { not: null } },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: PRODUCT_WITH_VARIANTS,
    });
  }

  async getNewArrivals(limit = 10) {
    return this.prisma.product.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: PRODUCT_WITH_VARIANTS,
    });
  }

  async getMostViewed(limit = 10) {
    const views = await this.prisma.productView.groupBy({
      by: ['productId'],
      _count: { sessionId: true },
      orderBy: { _count: { sessionId: 'desc' } },
      take: limit,
    });
    const ids = views.map((v) => v.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: PRODUCT_WITH_VARIANTS,
    });
    return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  }

  // ─── Variant CRUD ─────────────────────────────────────────────────────────────

  async createVariant(productId: string, dto: CreateVariantDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    // Prevent duplicate color+size combo
    if (dto.color || dto.size) {
      const dupe = await this.prisma.productVariant.findFirst({
        where: {
          productId,
          color: dto.color ?? null,
          size: dto.size ?? null,
        },
      });
      if (dupe) throw new ConflictException(
        `A variant with color "${dto.color ?? '—'}" and size "${dto.size ?? '—'}" already exists`,
      );
    }

    return this.prisma.productVariant.create({
      data: { productId, ...dto, images: dto.images ?? [] },
    });
  }

  async updateVariant(variantId: string, dto: UpdateVariantDto) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: dto,
    });
  }

  async deleteVariant(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    return this.prisma.productVariant.delete({ where: { id: variantId } });
  }

  async getVariants(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: [{ color: 'asc' }, { size: 'asc' }],
    });
  }
}
