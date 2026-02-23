// app/api/admin/block-user/[id]/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

// PATCH /api/admin/block-user/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) return unauthorizedResponse();
    if (authUser.role !== 'ADMIN') return forbiddenResponse('Admin only');

    const targetId = params.id;
    if (!targetId) return errorResponse('User ID is required');

    // Optional safety: prevent blocking admins (including yourself)
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, email: true, role: true, isBlocked: true },
    });

    if (!targetUser) return errorResponse('User not found', 404);
    if (targetUser.role === 'ADMIN') {
      return forbiddenResponse('Admins cannot be blocked');
    }

    const body = await req.json().catch(() => ({}));
    const explicitIsBlocked = typeof body.isBlocked === 'boolean' ? body.isBlocked : undefined;

    const nextIsBlocked =
      explicitIsBlocked !== undefined ? explicitIsBlocked : !targetUser.isBlocked;

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { isBlocked: nextIsBlocked },
      select: { id: true, name: true, email: true, role: true, isBlocked: true },
    });

    return successResponse({
      user: updated,
      message: `User ${updated.isBlocked ? 'blocked' : 'unblocked'} successfully`,
    });
  } catch (error) {
    return errorResponse('Failed to update user block status', 500);
  }
}

