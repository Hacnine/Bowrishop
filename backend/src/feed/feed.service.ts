import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeedService {
  private readonly siteUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.siteUrl = this.config.get<string>('SITE_URL') ?? 'https://www.bowrishop.com';
  }

  async getFacebookFeed(): Promise<string> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true, parent: { select: { name: true } } } },
        variants: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
          take: 1, // lowest price variant
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const escapeXml = (str: string): string => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const items = products.map((product) => {
      // Lowest price — variant আছে তো variant price, নাহলে product price
      const lowestVariant = product.variants[0];
      const price = lowestVariant ? Number(lowestVariant.price) : Number(product.price);
      const comparePrice = lowestVariant?.comparePrice
        ? Number(lowestVariant.comparePrice)
        : product.comparePrice
          ? Number(product.comparePrice)
          : null;

      // Availability
      const totalStock = lowestVariant ? lowestVariant.stock : product.stock;
      let availability: string;
      if (product.isPreOrder) {
        availability = 'preorder';
      } else if (totalStock > 0) {
        availability = 'in stock';
      } else {
        availability = 'out of stock';
      }

      // Category path — "Parent > Child" format
      const categoryName = product.category
        ? product.category.parent
          ? `${product.category.parent.name} > ${product.category.name}`
          : product.category.name
        : '';

      // Product URL
      const productUrl = `${this.siteUrl}/products/${product.slug}`;

      // Image — first image only (Facebook requires absolute URL)
      const imageUrl = product.images[0] ?? '';

      // Description — 200 char truncate (Facebook limit 9999 but keep it clean)
      const description = escapeXml(
        (product.description ?? product.name).slice(0, 500).replace(/\n/g, ' '),
      );

      const salePriceAttr = comparePrice && comparePrice > price
        ? `<g:sale_price>${price.toFixed(2)} BDT</g:sale_price>
        <g:sale_price_effective_date>1970-01-01T00:00+00:00/2099-12-31T23:59+00:00</g:sale_price_effective_date>`
        : '';

      return `    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(product.name.slice(0, 150))}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${comparePrice && comparePrice > price ? comparePrice.toFixed(2) : price.toFixed(2)} BDT</g:price>
      ${salePriceAttr}
      <g:brand>Bowri Shop</g:brand>
      <g:google_product_category>5122</g:google_product_category>
      ${categoryName ? `<g:product_type>${escapeXml(categoryName)}</g:product_type>` : ''}
      ${product.tags?.length ? `<g:custom_label_0>${escapeXml(product.tags.slice(0, 3).join(', '))}</g:custom_label_0>` : ''}
    </item>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Bowri Shop Product Feed</title>
    <link>${this.siteUrl}</link>
    <description>Bowri Shop product catalog for Facebook Dynamic Ads</description>
${items.join('\n')}
  </channel>
</rss>`;
  }

  async getFeedStats() {
    const [total, inStock, outOfStock, preOrder] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({ where: { isActive: true, stock: { gt: 0 }, isPreOrder: false } }),
      this.prisma.product.count({ where: { isActive: true, stock: 0, isPreOrder: false } }),
      this.prisma.product.count({ where: { isActive: true, isPreOrder: true } }),
    ]);
    return { total, inStock, outOfStock, preOrder };
  }
}
