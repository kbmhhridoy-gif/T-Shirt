// app/api/auth/login/route.ts
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { successResponse, errorResponse, forbiddenResponse } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isBlocked: true,
        isActive: true,
        isMuted: true,
        avatar: true,
        image: true,
        isOnline: true,
        lastSeen: true,
      },
    });

    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password.trim(), user.password);
    if (!isPasswordValid) {
      return errorResponse('Invalid credentials', 401);
    }

    if (user.isBlocked) {
      return forbiddenResponse('Your account has been blocked by admin.');
    }
    if (user.role === 'EDITOR' && user.isActive === false) {
      return forbiddenResponse('Your account has been disabled by admin.');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;

    return successResponse({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
