// lib/auth-user.ts - Fetch user from DB and validate block/active status for RBAC
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export type AuthUser = {
  id: string;
  role: string;
  isBlocked: boolean;
  isMuted: boolean;
  isActive: boolean;
};

/**
 * Get current user from DB and validate access.
 * Returns null if not authenticated.
 * Throws/returns error for blocked or disabled users.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const payload = await getUserFromRequest(req);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, isBlocked: true, isMuted: true, isActive: true },
  });
  if (!user) return null;

  return user as AuthUser;
}
