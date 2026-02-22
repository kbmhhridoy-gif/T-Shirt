// app/api/users/block/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin only');

    const { userId, isBlocked } = await req.json();

    if (!userId) return errorResponse('User ID required');

    // Prevent blocking yourself
    if (userId === user.userId) return errorResponse("Cannot block yourself");

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return errorResponse('User not found', 404);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked },
      select: { id: true, name: true, email: true, isBlocked: true },
    });

    return successResponse({
      user: updated,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
    });
  } catch (error) {
    return errorResponse('Failed to update user', 500);
  }
}
