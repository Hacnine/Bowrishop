import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminProductQueryDto,
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  CreateVariantDto,
  UpdateVariantDto,
} from './dto/product.dto';
import { Prisma } from '@prisma/client';

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
  category: { select: { id: true, name: true, slug: true, parentId: true } },
  variants: {
    where: { isActive: true },
    select: VARIANT_SELECT,
    orderBy: [{ color: 'asc' as const }, { size: 'asc' as const }],
  },
  _count: { select: { reviews: true } },
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeSearch(value?: string) {
  const normalized = value?.trim().toLocaleLowerCase();
  return normalized ? normalized : undefined;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Product CRUD ─────────────────────────────────────────────────────────────

  async create(dto: CreateProductDto) {
    try {
      const slug = slugify(dto.name);
      const existing = await this.prisma.product.findUnique({ where: { slug } });
      if (existing) throw new ConflictException('Product name already exists');

      const preOrderDate = dto.preOrderDate ? new Date(dto.preOrderDate) : undefined;
      const variants = dto.variants?.length
        ? dto.variants
        : [{ price: 0, stock: 0, images: dto.images ?? [] }];

      const product = await this.prisma.product.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description ?? '',
          tags: dto.tags ?? [],
          categoryId: dto.categoryId,
          isActive: dto.isActive ?? true,
          isFeatured: dto.isFeatured ?? false,
          isPreOrder: dto.isPreOrder ?? false,
          preOrderNote: dto.preOrderNote,
          preOrderDate,
          specifications: dto.specifications ?? undefined,
          variants: {
            create: variants.map((v) => ({ ...v, images: v.images ?? [] })),
          },
        },
        include: PRODUCT_WITH_VARIANTS,
      });

      return product;
    } catch (error) {
      this.logger.error(`Error creating product`, error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (!product) throw new NotFoundException('Product not found');

      const data: any = { ...dto };
      // Slug intentionally NOT regenerated on name update — breaks existing URLs and ISR cache.
      delete data.slug;

      if (dto.preOrderDate !== undefined) {
        data.preOrderDate = dto.preOrderDate ? new Date(dto.preOrderDate) : null;
      }

      if (dto.isPreOrder === false) {
        data.preOrderNote = null;
        data.preOrderDate = null;
      }

      const updated = await this.prisma.product.update({
        where: { id },
        data,
        include: PRODUCT_WITH_VARIANTS,
      });

      await this.revalidateProductPage(updated.slug);
      this.logger.log(`Product updated successfully: ${id}`);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Error updating product ${id}:`,
        error instanceof Error ? error.message : JSON.stringify(error),
      );
      throw error;
    }
  }

  private async revalidateProductPage(slug: string) {
    const nextUrl = process.env.NEXT_INTERNAL_URL ?? 'http://frontend:3000';
    const secret = process.env.REVALIDATE_SECRET;

    this.logger.log(`[revalidate] starting for slug: "${slug}", NEXT_INTERNAL_URL: ${nextUrl}`);

    if (!secret) {
      this.logger.warn('[revalidate] REVALIDATE_SECRET is not set — skipping');
      return;
    }

    const tag = `product-${slug}`;
    const revalidateUrl = `${nextUrl}/api/revalidate?tag=${encodeURIComponent(tag)}&secret=${encodeURIComponent(secret)}`;
    this.logger.log(`[revalidate] POST ${revalidateUrl.replace(secret, '***')}`);

    try {
      const response = await fetch(revalidateUrl, { method: 'POST' });
      const body = await response.text().catch(() => '');
      this.logger.log(`[revalidate] response status: ${response.status}, body: ${body}`);

      if (!response.ok) {
        this.logger.warn(`[revalidate] FAILED for ${slug}: ${response.status} ${body}`);
        return;
      }

      this.logger.log(`[revalidate] SUCCESS for slug: "${slug}": ${body}`);
    } catch (error) {
      this.logger.error(
        `[revalidate] fetch threw for slug "${slug}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async remove(id: string) {
    try {
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (!product) throw new NotFoundException('Product not found');

      const deleted = await this.prisma.product.delete({ where: { id } });
      this.logger.log(`Product deleted successfully: ${id}`);
      return deleted;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Error deleting product ${id}:`,
        error instanceof Error ? error.message : JSON.stringify(error),
      );
      throw error;
    }
  }

  async findAll(query: ProductQueryDto) {
    const page = parseInt(query.page ?? '1');
    const limit = parseInt(query.limit ?? '12');
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    const search = normalizeSearch(query.search ?? query.q);

    if (query.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: query.categoryId },
        select: { id: true, subCategories: { select: { id: true } } },
      });

      if (category) {
        where.categoryId = {
          in: [category.id, ...category.subCategories.map((subCategory) => subCategory.id)],
        };
      }
    } else if (query.category) {
      const cat = await this.prisma.category.findFirst({
        where: { slug: { equals: normalizeSearch(query.category), mode: 'insensitive' } },
        include: { subCategories: { select: { id: true } } },
      });
      if (cat) {
        const categoryIds = [cat.id, ...cat.subCategories.map((s) => s.id)];
        where.categoryId = { in: categoryIds };
      }
    }

    // Price filter: now done via variants
    if (query.minPrice || query.maxPrice) {
      const priceFilter: any = {};
      if (query.minPrice) priceFilter.gte = parseFloat(query.minPrice);
      if (query.maxPrice) priceFilter.lte = parseFloat(query.maxPrice);
      where.variants = { some: { price: priceFilter, isActive: true } };
    }

    if (query.featured === 'true') where.isFeatured = true;

    // Sale filter: products that have at least one variant with a comparePrice
    if (query.sale === 'true') {
      where.variants = {
        ...(where.variants ?? {}),
        some: { ...(where.variants?.some ?? {}), comparePrice: { not: null }, isActive: true },
      };
    }

    if (query.preOrder === 'true') where.isPreOrder = true;

    let searchIds: string[] | undefined;
    if (search) {
      const searchTokens = [...new Set(search.split(/\s+/).filter(Boolean))];
      const tokenConditions = searchTokens.map((token) => {
        const pattern = `%${token}%`;
        return Prisma.sql`(
          p."name" ILIKE ${pattern}
          OR EXISTS (
            SELECT 1 FROM unnest(p."tags") AS tag
            WHERE tag ILIKE ${pattern}
          )
          OR c."name" ILIKE ${pattern}
          OR p."description" ILIKE ${pattern}
          OR COALESCE(p."specifications"::text, '') ILIKE ${pattern}
        )`;
      });

      const matches = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT p."id"
        FROM "Product" p
        INNER JOIN "Category" c ON c."id" = p."categoryId"
        WHERE p."isActive" = true
          AND (${Prisma.join(tokenConditions, ' OR ')})
      `);
      searchIds = matches.map(({ id }) => id);

      if (searchIds.length === 0) {
        return { products: [], total: 0, page, limit, totalPages: 0 };
      }

      where.id = { in: searchIds };
    }

    // Sort: price sorts now use variant's min price via raw or just default to createdAt
    // For price sort we do a subquery-based approach
    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'name_asc') orderBy = { name: 'asc' };
    if (query.sort === 'popular') orderBy = { reviews: { _count: 'desc' } };
    // price_asc / price_desc: Prisma doesn't support orderBy on relation aggregate directly,
    // so we fall back to createdAt and let the frontend sort if needed,
    // OR use a raw query. For now keeping createdAt as safe default.
    // TODO: implement raw price sort when needed.

    if (!search) {
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({ where, skip, take: limit, orderBy, include: PRODUCT_WITH_VARIANTS }),
        this.prisma.product.count({ where }),
      ]);

      return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const [matchedProducts, total] = await Promise.all([
      this.prisma.product.findMany({ where, include: PRODUCT_WITH_VARIANTS }),
      this.prisma.product.count({ where }),
    ]);

    const searchTokens = [...new Set(search.split(/\s+/).filter(Boolean))];
    const rankedProducts = matchedProducts
      .map((product) => {
        const searchableTags = product.tags.map((tag) => tag.toLocaleLowerCase());
        const categoryName = product.category?.name.toLocaleLowerCase() ?? '';
        const name = product.name.toLocaleLowerCase();
        const description = product.description.toLocaleLowerCase();
        const specifications = JSON.stringify(product.specifications ?? {}).toLocaleLowerCase();
        let score = 0;

        for (const token of searchTokens) {
          if (name.includes(token)) score += 1000;
          if (searchableTags.some((tag) => tag.includes(token))) score += 500;
          if (categoryName.includes(token)) score += 300;
          if (description.includes(token)) score += 100;
          if (specifications.includes(token)) score += 80;
        }

        return { product, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);

    const products = rankedProducts.slice(skip, skip + limit);

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async searchAdminProducts(query: AdminProductQueryDto) {
    const page = parseInt(query.page ?? '1');
    const limit = parseInt(query.limit ?? '15');
    const skip = (page - 1) * limit;
    const q = normalizeSearch(query.q);

    const where: any = q ? { name: { contains: q, mode: 'insensitive' } } : {};

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
    this.logger.log(`[findBySlug] called with slug: "${slug}" sessionId: ${sessionId ?? 'none'}`);
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        ...PRODUCT_WITH_VARIANTS,
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

    if (!product) {
      this.logger.error(`[findBySlug] NO product in DB for slug: "${slug}"`);
      throw new NotFoundException('Product not found');
    }
    this.logger.log(`[findBySlug] found product id: ${product.id} for slug: "${slug}"`);

    if (sessionId) {
      this.prisma.productView
        .upsert({
          where: { productId_sessionId: { productId: product.id, sessionId } } as any,
          update: { viewedAt: new Date() },
          create: { productId: product.id, sessionId },
        })
        .catch(() => {});
    }

    const avgRating = product.reviews.length
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

    return { ...product, averageRating: avgRating, reviewCount: product.reviews.length };
  }

  async getFeatured(limit = 8) {
    return this.prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
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
    if (items.length === 0) return [];
    const ids = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: PRODUCT_WITH_VARIANTS,
    });
    return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  }

  async getOnSale(limit = 10) {
    // Products with at least one active variant that has a comparePrice
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        variants: { some: { comparePrice: { not: null }, isActive: true } },
      },
      take: limit * 3,
      include: PRODUCT_WITH_VARIANTS,
    });

    return products
      .map((p) => {
        // Use the first active variant's price for discount calc
        const activeVariant = p.variants.find((v) => v.isActive && v.comparePrice != null);
        if (!activeVariant) return { ...p, discountPct: 0 };
        const discountPct = activeVariant.comparePrice
          ? ((Number(activeVariant.comparePrice) - Number(activeVariant.price)) /
              Number(activeVariant.comparePrice)) *
            100
          : 0;
        return { ...p, discountPct };
      })
      .filter((p) => p.discountPct > 0)
      .sort((a, b) => b.discountPct - a.discountPct)
      .slice(0, limit);
  }

  async getNewArrivals(limit = 10) {
    return this.prisma.product.findMany({
      where: { isActive: true, isFeatured: false },
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

  async getRelated(productId: string, limit = 20) {
    const current = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        categoryId: true,
        tags: true,
        variants: { where: { isActive: true }, select: { price: true }, take: 1 },
      },
    });
    if (!current) return [];

    const currentPrice = current.variants[0]?.price ?? 0;

    const sameCat = await this.prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        categoryId: current.categoryId,
      },
      take: 100,
      include: {
        ...PRODUCT_WITH_VARIANTS,
        _count: { select: { reviews: true, orderItems: true } },
      },
    });

    const scored = sameCat.map((p) => {
      const tagMatches = current.tags.filter((t) => p.tags.includes(t)).length;
      const orderScore = (p._count as any).orderItems ?? 0;
      const reviewScore = p._count.reviews ?? 0;
      const variantPrice = p.variants[0]?.price ?? 0;
      const priceDiff = Math.abs(Number(variantPrice) - Number(currentPrice));
      const priceScore = priceDiff < 200 ? 2 : priceDiff < 500 ? 1 : 0;
      const score = tagMatches * 3 + orderScore * 0.5 + reviewScore * 1 + priceScore;
      return { ...p, _score: score };
    });

    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, limit);
  }

  // ─── Variant CRUD ─────────────────────────────────────────────────────────────

  async createVariant(productId: string, dto: CreateVariantDto) {
    try {
      const product = await this.prisma.product.findUnique({ where: { id: productId } });
      if (!product) throw new NotFoundException('Product not found');

      const normalizedColor = dto.color?.trim() || null;
      const normalizedSize = dto.size?.trim() || null;
      const normalizedSku = dto.sku?.trim() || null;

      if (normalizedColor || normalizedSize) {
        const dupe = await this.prisma.productVariant.findFirst({
          where: { productId, color: normalizedColor, size: normalizedSize },
        });
        if (dupe) {
          throw new ConflictException(
            `A variant with color "${normalizedColor ?? '—'}" and size "${normalizedSize ?? '—'}" already exists`,
          );
        }
      }

      const variant = await this.prisma.productVariant.create({
        data: {
          productId,
          ...dto,
          color: normalizedColor,
          size: normalizedSize,
          sku: normalizedSku,
          images: dto.images ?? [],
        },
      });

      await this.revalidateProductPage(product.slug);
      this.logger.log(`Variant created: ${variant.id} for product: ${productId}`);
      return variant;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) throw error;
      if (error?.code === 'P2002') throw new ConflictException('Variant already exists');
      if (error?.code === 'P2025') throw new NotFoundException('Product or variant not found');
      this.logger.error(`Error creating variant for product ${productId}:`, error);
      throw error;
    }
  }

  async updateVariant(variantId: string, dto: UpdateVariantDto) {
    try {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: { select: { slug: true } } },
      });
      if (!variant) throw new NotFoundException('Variant not found');

      const data = {
        ...dto,
        ...(dto.color !== undefined ? { color: dto.color.trim() || null } : {}),
        ...(dto.size !== undefined ? { size: dto.size.trim() || null } : {}),
        ...(dto.sku !== undefined ? { sku: dto.sku.trim() || null } : {}),
      };
      const updated = await this.prisma.productVariant.update({ where: { id: variantId }, data });
      await this.revalidateProductPage(variant.product.slug);
      this.logger.log(`Variant updated: ${variantId}`);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error?.code === 'P2002') throw new ConflictException('This variant configuration already exists');
      this.logger.error(`Error updating variant ${variantId}:`, error);
      throw error;
    }
  }

  async deleteVariant(variantId: string) {
    try {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: { select: { id: true, slug: true } } },
      });
      if (!variant) throw new NotFoundException('Variant not found');

      // Prevent deleting the last variant — product must always have at least one
      const variantCount = await this.prisma.productVariant.count({
        where: { productId: variant.product.id },
      });
      if (variantCount <= 1) {
        throw new BadRequestException('Cannot delete the last variant. A product must have at least one variant.');
      }

      const deleted = await this.prisma.productVariant.delete({ where: { id: variantId } });
      await this.revalidateProductPage(variant.product.slug);
      this.logger.log(`Variant deleted: ${variantId}`);
      return deleted;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Error deleting variant ${variantId}:`, error);
      throw error;
    }
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