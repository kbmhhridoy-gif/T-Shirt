// app/api/admin/analytics/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin only');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      blockedUsers,
      pendingOrders,
      monthlyRevenue,
      weeklyOrders,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          orderItems: { include: { product: { select: { title: true } } } },
        },
      }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: 'PAID',
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    // Sales by day for chart (last 7 days) — use Prisma column names (camelCase)
    const salesData = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as orders,
        COALESCE(SUM("totalAmount"), 0) as revenue
      FROM orders
      WHERE "createdAt" >= ${sevenDaysAgo}
        AND "paymentStatus" = 'PAID'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    ` as any[];

    // Normalize raw query result: PostgreSQL returns COUNT/SUM as BigInt, which JSON.stringify cannot serialize
    const salesDataSerializable = salesData.map((row: any) => ({
      date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date),
      orders: Number(row.orders ?? 0),
      revenue: Number(row.revenue ?? 0),
    }));

    return successResponse({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount ?? 0,
        blockedUsers,
        pendingOrders,
        monthlyRevenue: monthlyRevenue._sum.totalAmount ?? 0,
        weeklyOrders,
      },
      recentOrders,
      salesData: salesDataSerializable,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return errorResponse('Failed to fetch analytics', 500);
  }
}
