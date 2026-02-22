// app/api/products/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const featured = searchParams.get('featured') === 'true';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      price: { gte: minPrice, lte: maxPrice },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    if (featured) where.isFeatured = true;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: { select: { name: true } },
          reviews: { select: { rating: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithRating = products.map((p) => ({
      ...p,
      avgRating:
        p.reviews.length > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
          : 0,
      reviewCount: p.reviews.length,
    }));

    return successResponse({
      products: productsWithRating,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Products GET error:', error);
    return errorResponse('Failed to fetch products', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'ADMIN') return forbiddenResponse('Only admins can create products');

    const body = await req.json();
    const {
      title,
      description,
      price,
      comparePrice,
      image,
      images,
      availableCuts,
      sizes,
      colors,
      stock,
      isFeatured,
      tags,
    } = body;

    if (!title || !description || !price || !image) {
      return errorResponse('Required fields missing');
    }

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        image,
        images: images || [image],
        availableCuts: availableCuts || ['Regular', 'Oversized'],
        sizes: sizes || ['S', 'M', 'L', 'XL'],
        colors: colors || ['#000000'],
        stock: parseInt(stock) || 0,
        isFeatured: isFeatured || false,
        tags: tags || [],
        createdById: user.userId,
      },
    });

    return successResponse({ product }, 201);
  } catch (error) {
    console.error('Product POST error:', error);
    return errorResponse('Failed to create product', 500);
  }
}
