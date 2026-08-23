import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, CreateGuestOrderDto, UpdateOrderStatusDto, CreateAdminCustomOrderDto } from './dto/order.dto';
import { MetaService } from '../meta/meta.service';
import { EmailService } from '../email/email.service';
import { Prisma, OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private metaService: MetaService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true, variant: true },
    });
    if (cartItems.length === 0) throw new BadRequestException('Cart is empty');

    // Stock validation — pre-order items skip stock check
    for (const item of cartItems) {
      if (!item.product.isActive)
        throw new BadRequestException(`${item.product.name} is no longer available`);

      if (!item.product.isPreOrder) {
        const currentStock = item.variant ? item.variant.stock : item.product.stock;
        if (currentStock < item.quantity)
          throw new BadRequestException(`Insufficient stock for ${item.product.name}`);
      }
    }

    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.variant ? Number(item.variant.price) : Number(item.product.price);
      return sum + price * item.quantity;
    }, 0);

    const shippingCharge = dto.shippingAddress?.shippingCharge ?? 80;

    let discount = 0;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode.toUpperCase() },
      });
      if (!coupon || !coupon.isActive) throw new BadRequestException('Invalid coupon code');
      if (coupon.expiresAt && coupon.expiresAt < new Date())
        throw new BadRequestException('Coupon has expired');
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
        throw new BadRequestException('Coupon usage limit reached');
      if (subtotal < Number(coupon.minOrder))
        throw new BadRequestException(`Minimum order ৳${coupon.minOrder} required for this coupon`);

      discount =
        coupon.discountType === 'PERCENTAGE'
          ? (subtotal * Number(coupon.discount)) / 100
          : Math.min(Number(coupon.discount), subtotal);

      await this.prisma.coupon.update({
        where: { code: coupon.code },
        data: { usedCount: { increment: 1 } },
      });
    }

    const total = Math.max(subtotal - discount + Number(shippingCharge), 0);

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          subtotal,
          discount,
          shippingCharge,
          total,
          couponCode: dto.couponCode?.toUpperCase(),
          shippingAddress: dto.shippingAddress as any,
          notes: dto.notes,
          items: {
            create: cartItems.map((item): Prisma.OrderItemUncheckedCreateWithoutOrderInput => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.variant ? item.variant.price : item.product.price,
              // Pre-order flag: product এর isPreOrder থেকে copy করো
              isPreOrder: item.product.isPreOrder,
              variantSnapshot: item.variant
                ? {
                    color: item.variant.color,
                    size: item.variant.size,
                    colorHex: item.variant.colorHex,
                    images: item.variant.images,
                    price: item.variant.price,
                  }
                : Prisma.JsonNull,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      // Stock decrement — pre-order items এর stock কমাবো না
      for (const item of cartItems) {
        if (item.product.isPreOrder) continue; // skip pre-order

        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      await tx.cartItem.deleteMany({ where: { userId } });
      return newOrder;
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (user) {
      this.emailService.sendOrderConfirmation(user.email, user.name, order).catch(console.error);
      // Fire server-side Meta Conversions API event (do not block order flow)
      this.metaService.trackPurchase({
        orderId: order.id,
        total: Number(order.total),
        productIds: order.items.map((i) => i.productId),
        userEmail: user?.email,
        userPhone: (order.shippingAddress as any)?.phone,
        clientIp: (dto as any)?.clientIp,
        userAgent: (dto as any)?.clientUserAgent,
        fbp: (dto as any)?.fbp,
        fbc: (dto as any)?.fbc,
        eventId: (dto as any)?.eventId,
      }).catch(console.error);
    }

    return order;
  }

  async getUserOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { product: { select: { name: true, images: true } } },
          },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOrderById(userId: string, orderId: string, isAdmin = false) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: true, slug: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!isAdmin && order.userId !== userId) throw new ForbiddenException();
    return order;
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status as OrderStatus },
      include: { user: { select: { email: true, name: true } } },
    });

    if (dto.status === 'SHIPPED' && updated.user) {
      this.emailService
        .sendShippingUpdate(updated.user.email, updated.user.name, updated)
        .catch(console.error);
    }

    return updated;
  }

  async getAdminOrders(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as OrderStatus } : {};
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: { product: { select: { name: true, images: true } } },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data: orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createGuestOrder(dto: CreateGuestOrderDto) {
    const { items, guestEmail, guestName, shippingAddress, couponCode, notes } = dto;

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });

    const variantIds = items
      .map((i) => i.variantId)
      .filter((v): v is string => v !== null && v !== undefined);
    const variants =
      variantIds.length > 0
        ? await this.prisma.productVariant.findMany({ where: { id: { in: variantIds } } })
        : [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.isActive) throw new BadRequestException(`Product not available`);

      // Pre-order items: stock check skip করো
      if (!product.isPreOrder) {
        const variant = variants.find((v) => v.id === item.variantId);
        const currentStock = variant ? variant.stock : product.stock;
        if (currentStock < item.quantity)
          throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }
    }

    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const variant = variants.find((v) => v.id === item.variantId);
      return sum + (variant ? Number(variant.price) : Number(product.price)) * item.quantity;
    }, 0);

    const shippingCharge = shippingAddress?.shippingCharge ?? 80;

    let discount = 0;
    if (couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });
      if (!coupon || !coupon.isActive) throw new BadRequestException('Invalid coupon code');
      if (coupon.expiresAt && coupon.expiresAt < new Date())
        throw new BadRequestException('Coupon has expired');
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
        throw new BadRequestException('Coupon usage limit reached');
      if (subtotal < Number(coupon.minOrder))
        throw new BadRequestException(`Minimum order ৳${coupon.minOrder} required`);

      discount =
        coupon.discountType === 'PERCENTAGE'
          ? (subtotal * Number(coupon.discount)) / 100
          : Math.min(Number(coupon.discount), subtotal);

      await this.prisma.coupon.update({
        where: { code: coupon.code },
        data: { usedCount: { increment: 1 } },
      });
    }

    const total = Math.max(subtotal - discount + Number(shippingCharge), 0);

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: null,
          guestEmail,
          guestName,
          subtotal,
          discount,
          shippingCharge,
          total,
          couponCode: couponCode?.toUpperCase(),
          shippingAddress: shippingAddress as any,
          notes,
          items: {
            create: items.map((item): Prisma.OrderItemUncheckedCreateWithoutOrderInput => {
              const product = products.find((p) => p.id === item.productId)!;
              const variant = variants.find((v) => v.id === item.variantId);
              return {
                productId: item.productId,
                variantId: item.variantId || null,
                quantity: item.quantity,
                price: variant ? variant.price : product.price,
                isPreOrder: product.isPreOrder,
                variantSnapshot: variant
                  ? {
                      color: variant.color,
                      size: variant.size,
                      colorHex: variant.colorHex,
                      images: variant.images,
                      price: variant.price,
                    }
                  : Prisma.JsonNull,
              };
            }),
          },
        },
        include: { items: { include: { product: true } } },
      });

      // Pre-order items এর stock কমাবো না
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;
        if (product.isPreOrder) continue;

        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return newOrder;
    });

    this.emailService.sendOrderConfirmation(guestEmail, guestName, order).catch(console.error);
    // Meta conversions API for guest orders
    this.metaService.trackPurchase({
      orderId: order.id,
      total: Number(order.total),
      productIds: order.items.map((i) => i.productId),
      userEmail: guestEmail,
      userPhone: (order.shippingAddress as any)?.phone,
      clientIp: (dto as any)?.clientIp,
      userAgent: (dto as any)?.clientUserAgent,
      fbp: (dto as any)?.fbp,
      fbc: (dto as any)?.fbc,
      eventId: (dto as any)?.eventId,
    }).catch(console.error);
    return order;
  }

  async getGuestOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });
    if (!order || order.userId !== null) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Admin custom order — admin নিজে manually order create করে
   * Custom price, custom customer info, stock update optional
   */
  async createAdminCustomOrder(dto: CreateAdminCustomOrderDto, adminId: string) {
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const variantIds = dto.items
      .map((i) => i.variantId)
      .filter((v): v is string => !!v);
    const variants = variantIds.length > 0
      ? await this.prisma.productVariant.findMany({ where: { id: { in: variantIds } } })
      : [];

    // Validate products exist
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new NotFoundException(`Product not found: ${item.productId}`);
    }

    const shippingCharge = dto.shippingCharge ?? 0;

    // subtotal = sum of (customPrice * quantity)
    const subtotal = dto.items.reduce((sum, item) => sum + item.customPrice * item.quantity, 0);
    const total = subtotal + shippingCharge;

    const shippingAddress = {
      name: dto.customerName,
      phone: dto.customerPhone,
      address: dto.address,
      city: dto.city,
      district: dto.district ?? '',
      shippingCharge,
    };

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: null,
          guestName: dto.customerName,
          guestEmail: null,
          subtotal,
          discount: 0,
          shippingCharge,
          total,
          shippingAddress: shippingAddress as any,
          notes: dto.notes
            ? `[Admin Order] ${dto.notes}`
            : '[Admin Order]',
          items: {
            create: dto.items.map((item) => {
              const variant = variants.find((v) => v.id === item.variantId);
              return {
                productId: item.productId,
                variantId: item.variantId ?? null,
                quantity: item.quantity,
                // customPrice use করো — এটাই admin এর set করা price
                price: item.customPrice,
                variantSnapshot: variant
                  ? {
                      color: variant.color,
                      size: variant.size,
                      colorHex: variant.colorHex,
                      images: variant.images,
                      price: item.customPrice, // custom price snapshot এ রাখো
                    }
                  : undefined,
              };
            }),
          },
        },
        include: {
          items: { include: { product: { select: { name: true, images: true } } } },
        },
      });

      // Stock update — skipStockUpdate: true দিলে skip করো
      if (!dto.skipStockUpdate) {
        for (const item of dto.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      }

      return newOrder;
    });

    return order;
  }
}
