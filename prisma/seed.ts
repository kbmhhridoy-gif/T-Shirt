// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed admin (update password too so re-seed resets to admin123)
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@threadhaus.com' },
    update: { password: adminPassword, role: Role.ADMIN, name: 'Super Admin' },
    create: {
      name: 'Super Admin',
      email: 'admin@threadhaus.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Seed editor (update password too so re-seed resets to editor123)
  const editorPassword = await bcrypt.hash('editor123', 12);
  const editor = await prisma.user.upsert({
    where: { email: 'editor@threadhaus.com' },
    update: { password: editorPassword, role: Role.EDITOR, name: 'Content Editor' },
    create: {
      name: 'Content Editor',
      email: 'editor@threadhaus.com',
      password: editorPassword,
      role: Role.EDITOR,
    },
  });

  // Seed site settings
  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      bannerTitle: 'Thread Haus',
      bannerSubtitle: 'Premium T-Shirts Crafted for the Bold',
      featuredSection: 'Featured Collection',
    },
  });

  // Seed products
  const products = [
    {
      title: 'Phantom Black Crew',
      description: 'Ultra-soft 100% organic cotton. A staple redefined with heavyweight 280gsm fabric that drapes perfectly.',
      price: 1299,
      comparePrice: 1599,
      image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
      images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'],
      availableCuts: ['Regular', 'Oversized', 'Slim Fit', 'Cropped'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colors: ['#000000', '#1a1a2e', '#16213e'],
      stock: 50,
      isFeatured: true,
      tags: ['black', 'crew', 'basic'],
      createdById: admin.id,
    },
    {
      title: 'Arctic White Essential',
      description: 'Pure white minimalism at its finest. Triple-washed for ultimate softness.',
      price: 1199,
      comparePrice: 1499,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
      availableCuts: ['Regular', 'Oversized', 'Boxy'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colors: ['#ffffff', '#f5f5f0', '#e8e8e0'],
      stock: 75,
      isFeatured: true,
      tags: ['white', 'essential', 'minimal'],
      createdById: admin.id,
    },
    {
      title: 'Terracotta Sunset Tee',
      description: 'Earthy tones for the modern soul. Garment-dyed for a lived-in look from day one.',
      price: 1399,
      image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800',
      images: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800'],
      availableCuts: ['Regular', 'Oversized', 'Relaxed'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['#c1440e', '#d4691e', '#8b2500'],
      stock: 30,
      isFeatured: true,
      tags: ['terracotta', 'earthy', 'premium'],
      createdById: editor.id,
    },
    {
      title: 'Sage Green Everyday',
      description: 'Muted greens for a calm, collected look. French terry interior for warmth.',
      price: 1499,
      image: 'https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800',
      images: ['https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800'],
      availableCuts: ['Regular', 'Oversized', 'Cropped'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['#87a878', '#6b8f61', '#4a7c59'],
      stock: 40,
      isFeatured: false,
      tags: ['sage', 'green', 'everyday'],
      createdById: admin.id,
    },
    {
      title: 'Midnight Navy Classic',
      description: 'The navy tee done right. Structured shoulders, relaxed body.',
      price: 1299,
      image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
      images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800'],
      availableCuts: ['Regular', 'Slim Fit', 'Athletic'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['#0a0a2e', '#1a1a5e', '#161676'],
      stock: 60,
      isFeatured: false,
      tags: ['navy', 'classic', 'structured'],
      createdById: editor.id,
    },
    {
      title: 'Dust Rose Vintage Wash',
      description: 'Soft rose hues with a vintage garment wash. Perfect for any occasion.',
      price: 1349,
      comparePrice: 1599,
      image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800',
      images: ['https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800'],
      availableCuts: ['Regular', 'Oversized', 'Boxy', 'Cropped'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['#d4a0a7', '#c47f8a', '#b06070'],
      stock: 25,
      isFeatured: true,
      tags: ['rose', 'vintage', 'feminine'],
      createdById: admin.id,
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log('✅ Database seeded successfully');
  console.log('Admin: admin@threadhaus.com / admin123');
  console.log('Editor: editor@threadhaus.com / editor123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
