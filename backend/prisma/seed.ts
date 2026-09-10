// Seeds categories and promotion plans so the API returns real data out of
// the box. Run with `npm run prisma:seed` (see package.json).
//
// Category slugs intentionally mirror shared/src/mock/categories.mock.ts in
// the web app, so switching NEXT_PUBLIC_API_URL from mock to live data
// doesn't change any category URLs.
import { PrismaClient, PromotionTier } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedSubcategory {
  slug: string;
  name: string;
}

interface SeedCategory {
  slug: string;
  name: string;
  subcategories: SeedSubcategory[];
}

const CATEGORY_TREE: SeedCategory[] = [
  {
    slug: 'vehicles', name: 'Vehicles',
    subcategories: [
      { slug: 'cars', name: 'Cars' },
      { slug: 'buses-microbuses', name: 'Buses & Microbuses' },
      { slug: 'motorcycles-scooters', name: 'Motorcycles & Scooters' },
      { slug: 'trucks-trailers', name: 'Trucks & Trailers' },
      { slug: 'vehicle-parts', name: 'Vehicle Parts & Accessories' },
    ],
  },
  {
    slug: 'real-estate', name: 'Real Estate',
    subcategories: [
      { slug: 'houses-apartments-rent', name: 'Houses & Apartments for Rent' },
      { slug: 'houses-apartments-sale', name: 'Houses & Apartments for Sale' },
      { slug: 'land-plots', name: 'Land & Plots for Sale' },
      { slug: 'commercial-property', name: 'Commercial Property' },
      { slug: 'short-let', name: 'Short-let Apartments' },
    ],
  },
  {
    slug: 'mobile-phones', name: 'Mobile Phones & Tablets',
    subcategories: [
      { slug: 'smartphones', name: 'Smartphones' },
      { slug: 'tablets', name: 'Tablets' },
      { slug: 'phone-accessories', name: 'Phone Accessories' },
      { slug: 'mobile-services', name: 'Mobile Phone Services' },
    ],
  },
  {
    slug: 'electronics', name: 'Electronics',
    subcategories: [
      { slug: 'tvs', name: 'TVs' },
      { slug: 'audio-music', name: 'Audio & Music Equipment' },
      { slug: 'computers-laptops', name: 'Computers & Laptops' },
      { slug: 'cameras', name: 'Cameras' },
      { slug: 'video-games', name: 'Video Games & Consoles' },
    ],
  },
  {
    slug: 'fashion', name: 'Fashion',
    subcategories: [
      { slug: 'womens-clothing', name: "Women's Clothing" },
      { slug: 'mens-clothing', name: "Men's Clothing" },
      { slug: 'shoes', name: 'Shoes' },
      { slug: 'bags', name: 'Bags' },
      { slug: 'jewellery-watches', name: 'Jewellery & Watches' },
    ],
  },
  {
    slug: 'jobs', name: 'Jobs',
    subcategories: [
      { slug: 'sales-marketing', name: 'Sales & Marketing' },
      { slug: 'it-software', name: 'IT & Software' },
      { slug: 'customer-service', name: 'Customer Service' },
      { slug: 'transportation', name: 'Transportation' },
      { slug: 'remote-jobs', name: 'Remote Jobs' },
    ],
  },
  {
    slug: 'home-furniture', name: 'Home & Furniture',
    subcategories: [
      { slug: 'furniture', name: 'Furniture' },
      { slug: 'home-appliances', name: 'Home Appliances' },
      { slug: 'kitchen-dining', name: 'Kitchen & Dining' },
      { slug: 'home-decor', name: 'Home Decor' },
    ],
  },
  {
    slug: 'health-beauty', name: 'Health & Beauty',
    subcategories: [
      { slug: 'skin-care', name: 'Skin Care' },
      { slug: 'makeup', name: 'Makeup' },
      { slug: 'hair', name: 'Hair' },
      { slug: 'fitness-equipment', name: 'Fitness Equipment' },
    ],
  },
  {
    slug: 'services', name: 'Services',
    subcategories: [
      { slug: 'repair-services', name: 'Repair Services' },
      { slug: 'cleaning-services', name: 'Cleaning Services' },
      { slug: 'event-services', name: 'Event Services' },
      { slug: 'tutoring-classes', name: 'Tutoring & Classes' },
    ],
  },
];

const PROMOTION_PLANS = [
  {
    name: 'Featured', tier: PromotionTier.FEATURED, price: 1000, currency: 'NGN', durationDays: 30,
    description: 'Get seen on the homepage.',
    features: ['Homepage placement', 'Bold title', 'Listed for 30 days'],
  },
  {
    name: 'Top Ad', tier: PromotionTier.TOP_AD, price: 2500, currency: 'NGN', durationDays: 30,
    description: 'Jump to the top of your category.',
    features: ['Top of category', 'Bold + colored title', 'Listed for 30 days'],
  },
  {
    name: 'VIP', tier: PromotionTier.VIP, price: 5000, currency: 'NGN', durationDays: 60,
    description: 'Maximum visibility everywhere on Jsmart.',
    features: ['Top of search & category', 'VIP badge', 'Listed for 60 days'],
  },
];

async function main() {
  console.log('Seeding categories...');
  for (const [index, category] of CATEGORY_TREE.entries()) {
    const parent = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: index },
      create: { slug: category.slug, name: category.name, sortOrder: index },
    });

    for (const [subIndex, sub] of category.subcategories.entries()) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { name: sub.name, parentId: parent.id, sortOrder: subIndex },
        create: { slug: sub.slug, name: sub.name, parentId: parent.id, sortOrder: subIndex },
      });
    }
  }
  console.log(`Seeded ${CATEGORY_TREE.length} categories with subcategories.`);

  console.log('Seeding promotion plans...');
  for (const plan of PROMOTION_PLANS) {
    await prisma.promotionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }
  console.log(`Seeded ${PROMOTION_PLANS.length} promotion plans.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
