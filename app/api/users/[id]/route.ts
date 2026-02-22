// app/api/users/[id]/route.ts - Admin: mute, disable, delete editor
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin only');

    const targetId = params.id;
    if (targetId === user.userId) return errorResponse('Cannot modify your own account');

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) return errorResponse('User not found', 404);
    if (targetUser.role !== 'EDITOR') return errorResponse('Only editors can be muted or disabled');

    const { isMuted, isActive } = await req.json();

    const data: { isMuted?: boolean; isActive?: boolean } = {};
    if (typeof isMuted === 'boolean') data.isMuted = isMuted;
    if (typeof isActive === 'boolean') data.isActive = isActive;

    if (Object.keys(data).length === 0) return errorResponse('No valid fields to update');

    const updated = await prisma.user.update({
      where: { id: targetId },
      data,
      select: { id: true, name: true, email: true, role: true, isMuted: true, isActive: true },
    });

    return successResponse({ user: updated });
  } catch (error) {
    return errorResponse('Failed to update user', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin only');

    const targetId = params.id;
    if (targetId === user.userId) return errorResponse('Cannot delete your own account');

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) return errorResponse('User not found', 404);
    if (targetUser.role !== 'EDITOR') return errorResponse('Can only delete editor accounts');

    await prisma.user.delete({ where: { id: targetId } });

    return successResponse({ message: 'Editor deleted successfully' });
  } catch (error) {
    return errorResponse('Failed to delete user', 500);
  }
}
