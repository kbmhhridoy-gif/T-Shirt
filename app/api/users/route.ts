// app/api/users/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'ADMIN') return forbiddenResponse();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const role = searchParams.get('role');
    const search = searchParams.get('search') || '';
    const blocked = searchParams.get('blocked');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (blocked === 'true') where.isBlocked = true;
    if (blocked === 'false') where.isBlocked = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total, paidTotals, productsPerUser] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isBlocked: true,
          isMuted: true,
          isActive: true,
          avatar: true,
          image: true,
          isOnline: true,
          lastSeen: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
      prisma.order.groupBy({
        by: ['userId'],
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.$queryRaw<{ userId: string; count: bigint }[]>`
        SELECT o."userId", COUNT(DISTINCT oi."productId") as count
        FROM order_items oi
        INNER JOIN orders o ON oi."orderId" = o.id
        WHERE o."paymentStatus" = 'PAID'
        GROUP BY o."userId"
      `,
    ]);

    const totalSpentByUser = Object.fromEntries(
      paidTotals.map((r) => [r.userId, r._sum.totalAmount ?? 0])
    );
    const productsPurchasedByUser = Object.fromEntries(
      productsPerUser.map((r) => [r.userId, Number(r.count)])
    );

    const usersWithContribution = users.map((u) => ({
      ...u,
      totalSpent: totalSpentByUser[u.id] ?? 0,
      productsPurchased: productsPurchasedByUser[u.id] ?? 0,
    }));

    return successResponse({
      users: usersWithContribution,
      pagination: { total, page, limit },
    });
  } catch (error) {
    return errorResponse('Failed to fetch users', 500);
  }
}
