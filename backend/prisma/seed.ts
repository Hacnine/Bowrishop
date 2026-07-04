import 'dotenv/config';
import { PrismaClient , Role, DiscountType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@trendora.com' },
    update: {},
    create: {
      email: 'admin@trendora.com',
      password: adminPassword,
      name: 'Admin',
      role: Role.ADMIN,
    },
  });

  // Test user
  const userPassword = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: 'user@trendora.com' },
    update: {},
    create: {
      email: 'user@trendora.com',
      password: userPassword,
      name: 'Test User',
      role: Role.USER,
    },
  });

  // Categories
  const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets and electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
    { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel', image: 'https://images.unsplash.com/photo-23381210434-271e8be1f52b?w=400' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Home essentials', image: 'https://images.unsplash.com/photo-56909114-f6e7ad7d3136?w=400' },
    { name: 'Sports', slug: 'sports', description: 'Sports and outdoors', image: 'https://images.unsplash.com/photo-71019613454-1cb2f99b2d8b?w=400' },
    { name: 'Books', slug: 'books', description: 'Books and media', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400' },
    { name: 'Bands & Clips', slug: 'bands-clips', description: 'Hair bands, clips and accessories for men and women', image: 'https://images.unsplash.com/photo-22337360788-8b13dee7a37e?w=400' },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = created.id;
  }

  // Products
  const products = [
    {
      name: 'Wireless Noise-Cancelling Headphones',
      slug: 'wireless-noise-cancelling-headphones',
      description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and superior sound quality.',
      price: 299.99,
      comparePrice: 399.99,
      stock: 50,
      images: ['https://images.unsplash.com/photo-05740420928-5e560c06d30e?w=600'],
      tags: ['headphones', 'wireless', 'audio'],
      categorySlug: 'electronics',
    },
    {
      name: 'Slim Fit Cotton T-Shirt',
      slug: 'slim-fit-cotton-t-shirt',
      description: 'Classic slim fit t-shirt made from 100% organic cotton. Available in multiple colors.',
      price: 24.99,
      comparePrice: 34.99,
      stock: 200,
      images: ['https://images.unsplash.com/photo-72163474-6864f9cf17ab?w=600'],
      tags: ['t-shirt', 'cotton', 'casual'],
      categorySlug: 'clothing',
    },
    {
      name: 'Smart Watch Pro',
      slug: 'smart-watch-pro',
      description: 'Feature-rich smartwatch with health monitoring, GPS, and 5-day battery life.',
      price: 199.99,
      comparePrice: 249.99,
      stock: 30,
      images: ['https://images.unsplash.com/photo-23275335684-37898b6baf30?w=600'],
      tags: ['watch', 'smart', 'fitness'],
      categorySlug: 'electronics',
    },
    {
      name: 'Non-Stick Cookware Set',
      slug: 'non-stick-cookware-set',
      description: '10-piece non-stick cookware set with glass lids, compatible with all stovetops.',
      price: 89.99,
      comparePrice: 129.99,
      stock: 40,
      images: ['https://images.unsplash.com/photo-4917865442-de89df76afd3?w=600'],
      tags: ['cookware', 'kitchen', 'non-stick'],
      categorySlug: 'home-kitchen',
    },
    {
      name: 'Running Shoes Ultra',
      slug: 'running-shoes-ultra',
      description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper.',
      price: 119.99,
      comparePrice: 159.99,
      stock: 75,
      images: ['https://images.unsplash.com/photo-42291026-7eec264c27ff?w=600'],
      tags: ['shoes', 'running', 'sport'],
      categorySlug: 'sports',
    },
    {
      name: 'The Art of Programming',
      slug: 'the-art-of-programming',
      description: 'Comprehensive guide to modern software development practices and algorithms.',
      price: 39.99,
      comparePrice: null,
      stock: 100,
      images: ['https://images.unsplash.com/photo-44716278-ca5e3f4abd8c?w=600'],
      tags: ['book', 'programming', 'education'],
      categorySlug: 'books',
    },
    {
      name: '4K Ultra HD Monitor',
      slug: '4k-ultra-hd-monitor',
      description: '27-inch 4K IPS monitor with 144Hz refresh rate, HDR support and USB-C connectivity.',
      price: 449.99,
      comparePrice: 549.99,
      stock: 20,
      images: ['https://images.unsplash.com/photo-27443224154-c4a3942d3acf?w=600'],
      tags: ['monitor', '4k', 'display'],
      categorySlug: 'electronics',
    },
    {
      name: 'Yoga Mat Premium',
      slug: 'yoga-mat-premium',
      description: 'Extra thick non-slip yoga mat with alignment lines, carrying strap included.',
      price: 49.99,
      comparePrice: 69.99,
      stock: 60,
      images: ['https://images.unsplash.com/photo-544367567-0f2fcb009e0b?w=600'],
      tags: ['yoga', 'fitness', 'mat'],
      categorySlug: 'sports',
    },
    {
      name: 'Linen Blazer',
      slug: 'linen-blazer',
      description: 'Lightweight linen blazer perfect for summer business casual occasions.',
      price: 89.99,
      comparePrice: 119.99,
      stock: 35,
      images: ['https://images.unsplash.com/photo-94938298603-c8148c4b4043?w=600'],
      tags: ['blazer', 'linen', 'formal'],
      categorySlug: 'clothing',
    },
    {
      name: 'French Press Coffee Maker',
      slug: 'french-press-coffee-maker',
      description: 'Stainless steel French press with double-wall insulation, keeps coffee hot for 2 hours.',
      price: 34.99,
      comparePrice: 44.99,
      stock: 80,
      images: ['https://images.unsplash.com/photo-11920170033-f8396924c348?w=600'],
      tags: ['coffee', 'kitchen', 'brewing'],
      categorySlug: 'home-kitchen',
    },
    {
      name: 'Satin Scrunchie Set — Women',
      slug: 'satin-scrunchie-set-women',
      description: 'Set of 8 satin scrunchies in assorted pastel colours. Gentle on hair, no crease, suitable for all hair types.',
      price: 9.99,
      comparePrice: 14.99,
      stock: 200,
      images: ['https://images.unsplash.com/photo-1616645258469-ec681c17f3ee?w=600'],
      tags: ['scrunchie', 'hair', 'accessories', 'women'],
      categorySlug: 'bands-clips',
    },
    {
      name: 'Strong-Hold Bobby Pins Pack — Women',
      slug: 'strong-hold-bobby-pins-women',
      description: 'Pack of 100 matte black bobby pins with anti-slip ridges. Stays put all day — perfect for updos and braids.',
      price: 6.49,
      comparePrice: null,
      stock: 300,
      images: ['https://images.unsplash.com/photo-85747860715-2ba37e788b70?w=600'],
      tags: ['bobby pins', 'clips', 'hair', 'women'],
      categorySlug: 'bands-clips',
    },
    {
      name: "Men's Elastic Sport Headband",
      slug: 'mens-elastic-sport-headband',
      description: 'Wide non-slip elastic headband for men. Moisture-wicking fabric keeps sweat out of your eyes during workouts.',
      price: 11.99,
      comparePrice: 16.99,
      stock: 150,
      images: ['https://images.nsplash.com/photo-71019613454-1cb2f99b2d8b?w=600'],
      tags: ['headband', 'sport', 'men', 'hair'],
      categorySlug: 'bands-clips',
    },
  ];

  for (const product of products) {
    const { categorySlug, comparePrice, price, ...rest } = product;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...rest,
        price: price,
        comparePrice: comparePrice ?? undefined,
        categoryId: createdCategories[categorySlug],
      },
    });
  }

  // Coupons
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% off your first order',
      discountType: DiscountType.PERCENTAGE,
      discount: 10,
      minOrder: 30,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'SAVE20' },
    update: {},
    create: {
      code: 'SAVE20',
      description: '$20 off orders over $100',
      discountType: DiscountType.FIXED,
      discount: 20,
      minOrder: 100,
      maxUses: 100,
      isActive: true,
    },
  });

  console.log('Seed completed!');
  console.log('Admin: admin@trendora.com / admin123');
  console.log('User:  user@trendora.com / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// git pull origin main && docker compose down && docker compose up -d