import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, price: true,
            comparePrice: true, images: true, stock: true, isActive: true,
          },
        },
        variant: {
          select: {
            id: true, color: true, colorHex: true, size: true,
            price: true, comparePrice: true, stock: true, images: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Price = variant price if a variant is selected, else product base price
    const subtotal = items.reduce((sum, item) => {
      const price = item.variant ? Number(item.variant.price) : Number(item.product.price);
      return sum + price * item.quantity;
    }, 0);

    return { items, subtotal };
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');

    // If the product has variants, a variantId is required
    const hasVariants = await this.prisma.productVariant.count({
      where: { productId: dto.productId, isActive: true },
    });
    if (hasVariants > 0 && !dto.variantId) {
      throw new BadRequestException('Please select a variant (color/size) before adding to cart');
    }

    let effectiveStock: number;

    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
      });
      if (!variant || !variant.isActive) throw new NotFoundException('Variant not found');
      if (variant.productId !== dto.productId) throw new BadRequestException('Variant does not belong to this product');
      effectiveStock = variant.stock;
    } else {
      effectiveStock = product.stock;
    }

    if (effectiveStock < dto.quantity) throw new BadRequestException('Insufficient stock');

    // Cart key: (userId, productId, variantId) — same product but different variants = different rows
    const existing = await this.prisma.cartItem.findFirst({
      where: { userId, productId: dto.productId, variantId: dto.variantId ?? null },
    });

    if (existing) {
      const newQty = existing.quantity + dto.quantity;
      if (effectiveStock < newQty) throw new BadRequestException('Insufficient stock');
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
        include: { product: true, variant: true },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        userId,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
        quantity: dto.quantity,
      },
      include: { product: true, variant: true },
    });
  }

  async updateItem(userId: string, cartItemId: string, dto: UpdateCartItemDto) {
    console.log(cartItemId)
    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true, variant: true },
    });
    if (!item || item.userId !== userId) throw new NotFoundException('Cart item not found');

    const effectiveStock = item.variant ? item.variant.stock : item.product.stock;
    if (effectiveStock < dto.quantity) throw new BadRequestException('Insufficient stock');

    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: dto.quantity },
      include: { product: true, variant: true },
    });
  }

  async removeItem(userId: string, cartItemId: string) {
    console.log(cartItemId)
    const item = await this.prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!item || item.userId !== userId) throw new NotFoundException('Cart item not found');
    return this.prisma.cartItem.delete({ where: { id: cartItemId } });
  }

  async clearCart(userId: string) {
    return this.prisma.cartItem.deleteMany({ where: { userId } });
  }
}
