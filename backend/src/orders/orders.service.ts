import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, CreateGuestOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { EmailService } from '../email/email.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // Get cart
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });
    if (cartItems.length === 0) throw new BadRequestException('Cart is empty');

    // Validate stock
    for (const item of cartItems) {
      if (!item.product.isActive) throw new BadRequestException(`${item.product.name} is no longer available`);
      if (item.product.stock < item.quantity)
        throw new BadRequestException(`Insufficient stock for ${item.product.name}`);
    }

    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    // Coupon validation
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
        throw new BadRequestException(`Minimum order $${coupon.minOrder} required for this coupon`);

      discount = coupon.discountType === 'PERCENTAGE'
        ? (subtotal * Number(coupon.discount)) / 100
        : Math.min(Number(coupon.discount), subtotal);

      await this.prisma.coupon.update({
        where: { code: coupon.code },
        data: { usedCount: { increment: 1 } },
      });
    }

    const total = Math.max(subtotal - discount, 0);

    // Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          subtotal,
          discount,
          total,
          couponCode: dto.couponCode?.toUpperCase(),
          shippingAddress: dto.shippingAddress as any,
          notes: dto.notes,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      // Update stock
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return newOrder;
    });

    // Send confirmation email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (user) {
      this.emailService.sendOrderConfirmation(user.email, user.name, order).catch(console.error);
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
        include: { items: { include: { product: { select: { name: true, images: true } } } } },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOrderById(userId: string, orderId: string, isAdmin = false) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { id: true, name: true, images: true, slug: true } } } },
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
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createGuestOrder(dto: CreateGuestOrderDto) {
    const { items, guestEmail, guestName, shippingAddress, couponCode, notes } = dto;

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.isActive)
        throw new BadRequestException(`Product not available`);
      if (product.stock < item.quantity)
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
    }

    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

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
        throw new BadRequestException(`Minimum order $${coupon.minOrder} required`);

      discount =
        coupon.discountType === 'PERCENTAGE'
          ? (subtotal * Number(coupon.discount)) / 100
          : Math.min(Number(coupon.discount), subtotal);

      await this.prisma.coupon.update({
        where: { code: coupon.code },
        data: { usedCount: { increment: 1 } },
      });
    }

    const total = Math.max(subtotal - discount, 0);

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: null,
          guestEmail,
          guestName,
          subtotal,
          discount,
          total,
          couponCode: couponCode?.toUpperCase(),
          shippingAddress: shippingAddress as any,
          notes,
          items: {
            create: items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              return { productId: item.productId, quantity: item.quantity, price: product.price };
            }),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    this.emailService.sendOrderConfirmation(guestEmail, guestName, order).catch(console.error);

    return order;
  }

  async getGuestOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });
    if (!order || order.userId !== null)
      throw new NotFoundException('Order not found');
    return order;
  }
}

