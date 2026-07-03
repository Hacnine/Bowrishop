import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      revenue,
      recentOrders,
      topProducts,
      ordersByStatus,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] } },
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const topProductIds = topProducts.map((p) => p.productId);
    const topProductDetails = await this.prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, images: true, price: true },
    });

    const enrichedTop = topProducts.map((tp) => ({
      ...tp,
      product: topProductDetails.find((p) => p.id === tp.productId),
    }));

    return {
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue: revenue._sum.total ?? 0,
      recentOrders,
      topProducts: enrichedTop,
      ordersByStatus,
    };
  }
}
