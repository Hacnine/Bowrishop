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

      let totalStock = dto.stock;
      let basePrice = dto.price;
      let baseComparePrice = dto.comparePrice;
      let variantData;

      if (dto.variants && dto.variants.length > 0) {
        totalStock = dto.variants.reduce((sum, v) => sum + v.stock, 0);
        basePrice = Math.min(...dto.variants.map((v) => v.price));

        const variantComparePrices = dto.variants
          .map((v) => v.comparePrice)
          .filter((p): p is number => p !== undefined && p !== null);
        baseComparePrice =
          variantComparePrices.length > 0 ? Math.min(...variantComparePrices) : undefined;

        variantData = dto.variants.map((v) => ({ ...v, images: v.images ?? [] }));
      } else {
        variantData = [
          {
            price: dto.price,
            comparePrice: dto.comparePrice,
            stock: dto.stock ?? 0,
            images: dto.images ?? [],
          },
        ];
      }

      // preOrderDate string → DateTime conversion
      const preOrderDate = dto.preOrderDate ? new Date(dto.preOrderDate) : undefined;

      const product = await this.prisma.product.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description ?? '',
          price: basePrice,
          comparePrice: baseComparePrice,
          stock: totalStock,
          images: dto.images ?? [],
          tags: dto.tags ?? [],
          categoryId: dto.categoryId,
          isActive: dto.isActive ?? true,
          isFeatured: dto.isFeatured ?? false,
          // Pre-order fields
          isPreOrder: dto.isPreOrder ?? false,
          preOrderNote: dto.preOrderNote,
          preOrderDate,
          // Specifications
          specifications: dto.specifications ?? undefined,
          variants: { create: variantData },
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
      // Slug is intentionally NOT regenerated on name update.
      // Changing the slug breaks existing URLs and ISR cache entries.
      // The slug is fixed at creation time.
      delete data.slug;

      // preOrderDate string → DateTime
      if (dto.preOrderDate !== undefined) {
        data.preOrderDate = dto.preOrderDate ? new Date(dto.preOrderDate) : null;
      }

      // isPreOrder false করলে pre-order fields clear করে দাও
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

    if (!secret) {
      this.logger.warn('REVALIDATE_SECRET is not configured; skipping product revalidation');
      return;
    }

    try {
      const response = await fetch(
        `${nextUrl}/api/revalidate?tag=${encodeURIComponent(`product-${slug}`)}&secret=${encodeURIComponent(secret)}`,
        { method: 'POST' },
      );
      const body = await response.text().catch(() => '');

      if (!response.ok) {
        this.logger.warn(`Product revalidation failed for ${slug}: ${response.status} ${body}`);
        return;
      }

      this.logger.log(`Product page revalidated for ${slug}: ${body}`);
    } catch (error) {
      this.logger.warn(
        `Product revalidation request failed for ${slug}: ${error instanceof Error ? error.message : String(error)}`,
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

  async removeImage(id: string, imageUrl: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { images: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const images = product.images.filter((url) => url !== imageUrl);
    if (images.length === product.images.length) {
      throw new NotFoundException('Image not found on this product');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { images },
      include: PRODUCT_WITH_VARIANTS,
    });
    await this.revalidateProductPage(updated.slug);
    return updated;
  }

  async findAll(query: ProductQueryDto) {
    const page = parseInt(query.page ?? '1');
    const limit = parseInt(query.limit ?? '12');
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    const search = normalizeSearch(query.search ?? query.q);

    // Nested category support: categoryId দিলে শুধু সেই category;
    // category slug দিলে parent + সব subCategories include করো
    if (query.categoryId) {
      where.categoryId = query.categoryId;
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

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = parseFloat(query.minPrice);
      if (query.maxPrice) where.price.lte = parseFloat(query.maxPrice);
    }

    if (query.featured === 'true') where.isFeatured = true;
    if (query.sale === 'true') where.comparePrice = { not: null };
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

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'price_asc') orderBy = { price: 'asc' };
    if (query.sort === 'price_desc') orderBy = { price: 'desc' };
    if (query.sort === 'name_asc') orderBy = { name: 'asc' };
    if (query.sort === 'popular') orderBy = { reviews: { _count: 'desc' } };

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
    if (!product) throw new NotFoundException('Product not found');

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

  // শুধু admin যেগুলো isFeatured: true করেছে সেগুলো
  async getFeatured(limit = 8) {
    return this.prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: PRODUCT_WITH_VARIANTS,
    });
  }

  // সবচেয়ে বেশি quantity sell হয়েছে সেই order অনুযায়ী
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
    // orderItem এর sort order maintain করো
    return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  }

  // comparePrice আছে মানে sale চলছে, discount % বেশি যেগুলোতে সেগুলো আগে
  async getOnSale(limit = 10) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        comparePrice: { not: null },
      },
      take: limit * 3, // overfetch করে sort করবো
      include: PRODUCT_WITH_VARIANTS,
    });
    // discount % বেশি → আগে
    return products
      .map((p) => ({
        ...p,
        discountPct: p.comparePrice
          ? ((Number(p.comparePrice) - Number(p.price)) / Number(p.comparePrice)) * 100
          : 0,
      }))
      .filter((p) => p.discountPct > 0) // comparePrice < price এর absurd case বাদ
      .sort((a, b) => b.discountPct - a.discountPct)
      .slice(0, limit);
  }

  // সবচেয়ে নতুন products — createdAt দিয়ে sort
  async getNewArrivals(limit = 10) {
    return this.prisma.product.findMany({
      where: { isActive: true, isFeatured: false }, // featured products আলাদা section এ থাকবে
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
    // Current product এর category আর tags আনো
    const current = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, categoryId: true, tags: true, price: true },
    });
    if (!current) return [];

    // Same category এর products আনো (current বাদে)
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

    // Score করো: tag match + order count + review count
    const scored = sameCat.map((p) => {
      const tagMatches = current.tags.filter((t) => p.tags.includes(t)).length;
      const orderScore = (p._count as any).orderItems ?? 0;
      const reviewScore = p._count.reviews ?? 0;
      // Price range similarity (similar price = higher score)
      const priceDiff = Math.abs(Number(p.price) - Number(current.price));
      const priceScore = priceDiff < 200 ? 2 : priceDiff < 500 ? 1 : 0;

      const score = tagMatches * 3 + orderScore * 0.5 + reviewScore * 1 + priceScore;
      return { ...p, _score: score };
    });

    // Score দিয়ে sort, same score হলে orderItems বেশি আগে
    scored.sort((a, b) => b._score - a._score);

    return scored.slice(0, limit);
  }


  // ─── Variant CRUD ─────────────────────────────────────────────────────────────

  async createVariant(productId: string, dto: CreateVariantDto) {
    try {
      const product = await this.prisma.product.findUnique({ where: { id: productId } });
      if (!product) throw new NotFoundException('Product not found');

      if (dto.color || dto.size) {
        const dupe = await this.prisma.productVariant.findFirst({
          where: { productId, color: dto.color ?? null, size: dto.size ?? null },
        });
        if (dupe) {
          throw new ConflictException(
            `A variant with color "${dto.color ?? '—'}" and size "${dto.size ?? '—'}" already exists`,
          );
        }
      }

      const variant = await this.prisma.productVariant.create({
        data: { productId, ...dto, images: dto.images ?? [] },
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

      const updated = await this.prisma.productVariant.update({ where: { id: variantId }, data: dto });
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
        include: { product: { select: { slug: true } } },
      });
      if (!variant) throw new NotFoundException('Variant not found');

      const deleted = await this.prisma.productVariant.delete({ where: { id: variantId } });
      await this.revalidateProductPage(variant.product.slug);
      this.logger.log(`Variant deleted: ${variantId}`);
      return deleted;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
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