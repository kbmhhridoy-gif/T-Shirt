// app/api/upload/route.ts
import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();
    if (!['ADMIN', 'EDITOR'].includes(user.role)) return forbiddenResponse();

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) return errorResponse('No file provided');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const url = await uploadImage(base64);

    return successResponse({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse('Upload failed', 500);
  }
}
