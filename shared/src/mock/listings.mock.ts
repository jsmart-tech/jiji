import type { Listing } from '../types';

const H = 3600 * 1000;
const D = 24 * H;
const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

// LoremFlickr serves real photos matched to a keyword (unlike Picsum, which
// is just random) — `lock` pins a specific photo so the same listing always
// shows the same image instead of a different random one on every reload.
const demoImages = (keyword: string, lockBase: number, count = 2): string[] =>
  Array.from({ length: count }, (_, i) => `https://loremflickr.com/900/900/${keyword}?lock=${lockBase * 10 + i}`);

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'l1', slug: 'toyota-camry-2015-full-option', title: 'Toyota Camry 2015, Full Option',
    description: 'Clean Toyota Camry 2015, first body, factory AC, alloy wheels. Accident-free and duty fully paid. Serious buyers only, come with your mechanic.',
    price: 8500000, currency: 'NGN', priceType: 'NEGOTIABLE', condition: 'USED', status: 'ACTIVE', promotionTier: 'FEATURED',
    categorySlug: 'vehicles', subcategorySlug: 'cars', state: 'Lagos', lga: 'Ikeja', images: demoImages('sedan', 1),
    attributes: [
      { key: 'Brand', value: 'Toyota' }, { key: 'Model', value: 'Camry' }, { key: 'Year', value: '2015' },
      { key: 'Mileage', value: '81,000 km' }, { key: 'Transmission', value: 'Automatic' }, { key: 'Fuel', value: 'Petrol' },
    ],
    sellerId: 's_emeka', sellerName: 'Emeka Obi', sellerRating: 4.8, isVerifiedSeller: true, sellerPhone: '0803 123 4567',
    viewCount: 214, createdAt: iso(3 * H),
  },
  {
    id: 'l2', slug: '3-bedroom-flat-lekki', title: '3 Bedroom Flat, Newly Built',
    description: 'Tastefully finished 3 bedroom flat in a serene estate. All rooms ensuite, POP ceiling, fitted kitchen. Water and light constant.',
    price: 1200000, currency: 'NGN', priceType: 'FIXED', condition: 'NEW', status: 'ACTIVE', promotionTier: 'FEATURED',
    categorySlug: 'real-estate', subcategorySlug: 'houses-apartments-rent', state: 'Lagos', lga: 'Lekki', images: demoImages('apartment', 2),
    attributes: [
      { key: 'Bedrooms', value: '3' }, { key: 'Bathrooms', value: '3' }, { key: 'Type', value: 'Flat/Apartment' }, { key: 'Furnishing', value: 'Unfurnished' },
    ],
    sellerId: 's_fatima', sellerName: 'Fatima Bello', sellerRating: 4.6, isVerifiedSeller: true, sellerPhone: '0805 234 5678',
    viewCount: 389, createdAt: iso(7 * H),
  },
  {
    id: 'l3', slug: 'iphone-13-pro-max-256gb', title: 'iPhone 13 Pro Max 256GB',
    description: 'UK used iPhone 13 Pro Max, 256GB, Sierra Blue. Battery health 91%. Clean IMEI, no cracks, no repairs. Complete box and charger.',
    price: 450000, currency: 'NGN', priceType: 'NEGOTIABLE', condition: 'USED', status: 'ACTIVE', promotionTier: 'VIP',
    categorySlug: 'mobile-phones', subcategorySlug: 'smartphones', state: 'Abuja (FCT)', lga: 'Wuse', images: demoImages('smartphone', 3),
    attributes: [
      { key: 'Brand', value: 'Apple' }, { key: 'Storage', value: '256GB' }, { key: 'Color', value: 'Sierra Blue' }, { key: 'Battery Health', value: '91%' },
    ],
    sellerId: 's_tunde', sellerName: 'Tunde Kalu', sellerRating: 4.9, isVerifiedSeller: true, sellerPhone: '0806 345 6789',
    viewCount: 530, createdAt: iso(1 * H),
  },
  {
    id: 'l4', slug: 'samsung-55-4k-smart-tv', title: 'Samsung 55" 4K Smart TV',
    description: 'Brand new, sealed in box, 1 year warranty. Crystal UHD display with smart remote and screen mirroring.',
    price: 280000, currency: 'NGN', priceType: 'FIXED', condition: 'NEW', status: 'ACTIVE', promotionTier: 'NONE',
    categorySlug: 'electronics', subcategorySlug: 'tvs', state: 'Abuja (FCT)', lga: 'Garki', images: demoImages('television', 4),
    attributes: [{ key: 'Brand', value: 'Samsung' }, { key: 'Size', value: '55 inch' }, { key: 'Resolution', value: '4K UHD' }],
    sellerId: 's_chidinma', sellerName: 'Chidinma Ude', sellerRating: 4.5, isVerifiedSeller: false, sellerPhone: '0807 456 7890',
    viewCount: 97, createdAt: iso(20 * H),
  },
  {
    id: 'l5', slug: 'l-shaped-fabric-sofa', title: 'L-Shaped Fabric Sofa Set',
    description: '6-seater L-shaped sofa, grey fabric, barely used, no stains or tears. Buyer arranges pickup.',
    price: 180000, currency: 'NGN', priceType: 'NEGOTIABLE', condition: 'USED', status: 'ACTIVE', promotionTier: 'NONE',
    categorySlug: 'home-furniture', subcategorySlug: 'furniture', state: 'Abuja (FCT)', lga: 'Gwarinpa', images: demoImages('sofa', 5),
    attributes: [{ key: 'Seats', value: '6' }, { key: 'Material', value: 'Fabric' }, { key: 'Color', value: 'Grey' }],
    sellerId: 's_ngozi', sellerName: 'Ngozi Eze', sellerRating: 4.3, isVerifiedSeller: false, sellerPhone: '0808 567 8901',
    viewCount: 64, createdAt: iso(2 * D),
  },
  {
    id: 'l6', slug: 'ankara-wrap-dress', title: 'Ankara Print Wrap Dress',
    description: 'Handmade Ankara wrap dress, true to size, sizes 8-16 available on request.',
    price: 15000, currency: 'NGN', priceType: 'FIXED', condition: 'NEW', status: 'ACTIVE', promotionTier: 'NONE',
    categorySlug: 'fashion', subcategorySlug: 'womens-clothing', state: 'Oyo', lga: 'Bodija', images: demoImages('dress', 6),
    attributes: [{ key: 'Size', value: 'M - XL' }, { key: 'Fabric', value: 'Ankara Cotton' }],
    sellerId: 's_amaka', sellerName: 'Amaka Chukwu', sellerRating: 4.7, isVerifiedSeller: false, sellerPhone: '0809 678 9012',
    viewCount: 41, createdAt: iso(30 * H),
  },
  {
    id: 'l7', slug: 'hp-pavilion-i7', title: 'HP Pavilion Laptop, Core i7',
    description: 'Core i7 10th gen, 16GB RAM, 512GB SSD. Fast and clean, great for design and coding work.',
    price: 320000, currency: 'NGN', priceType: 'NEGOTIABLE', condition: 'USED', status: 'ACTIVE', promotionTier: 'NONE',
    categorySlug: 'electronics', subcategorySlug: 'computers-laptops', state: 'Lagos', lga: 'Yaba', images: demoImages('laptop', 7),
    attributes: [{ key: 'Processor', value: 'Core i7' }, { key: 'RAM', value: '16GB' }, { key: 'Storage', value: '512GB SSD' }],
    sellerId: 's_ibrahim', sellerName: 'Ibrahim Sule', sellerRating: 4.4, isVerifiedSeller: true, sellerPhone: '0810 789 0123',
    viewCount: 176, createdAt: iso(11 * H),
  },
  {
    id: 'l8', slug: 'honda-crv-2018', title: 'Honda CR-V 2018',
    description: 'Nigerian used, one owner, full service history. Reverse camera, leather seats, sunroof.',
    price: 14000000, currency: 'NGN', priceType: 'NEGOTIABLE', condition: 'USED', status: 'ACTIVE', promotionTier: 'TOP_AD',
    categorySlug: 'vehicles', subcategorySlug: 'cars', state: 'Rivers', lga: 'Trans Amadi', images: demoImages('suv', 8),
    attributes: [{ key: 'Brand', value: 'Honda' }, { key: 'Model', value: 'CR-V' }, { key: 'Year', value: '2018' }, { key: 'Mileage', value: '54,000 km' }],
    sellerId: 's_emeka', sellerName: 'Emeka Obi', sellerRating: 4.8, isVerifiedSeller: true, sellerPhone: '0803 123 4567',
    viewCount: 302, createdAt: iso(1 * D),
  },
  {
    id: 'l9', slug: 'self-contained-apartment-kano', title: 'Self-Contained Apartment',
    description: 'Self-con with private entrance, tiled floor, prepaid meter. Close to market and main road.',
    price: 450000, currency: 'NGN', priceType: 'FIXED', condition: 'USED', status: 'ACTIVE', promotionTier: 'NONE',
    categorySlug: 'real-estate', subcategorySlug: 'houses-apartments-rent', state: 'Kano', lga: 'Sabon Gari', images: demoImages('apartment', 9),
    attributes: [{ key: 'Bedrooms', value: 'Studio' }, { key: 'Type', value: 'Self-Contained' }],
    sellerId: 's_aisha', sellerName: 'Aisha Mohammed', sellerRating: 4.2, isVerifiedSeller: false, sellerPhone: '0811 890 1234',
    viewCount: 58, createdAt: iso(3 * D),
  },
  {
    id: 'l10', slug: '5kva-soundproof-generator', title: '5KVA Soundproof Generator',
    description: 'Brand new soundproof generator with key start, 1 year warranty and free delivery within Lagos.',
    price: 650000, currency: 'NGN', priceType: 'FIXED', condition: 'NEW', status: 'ACTIVE', promotionTier: 'NONE',
    categorySlug: 'electronics', subcategorySlug: 'tvs', state: 'Lagos', lga: 'Alimosho', images: demoImages('generator', 10),
    attributes: [{ key: 'Power', value: '5KVA' }, { key: 'Type', value: 'Soundproof' }, { key: 'Start', value: 'Key Start' }],
    sellerId: 's_chidinma', sellerName: 'Chidinma Ude', sellerRating: 4.5, isVerifiedSeller: false, sellerPhone: '0807 456 7890',
    viewCount: 88, createdAt: iso(5 * H),
  },
  {
    id: 'l11', slug: 'nike-air-force-1', title: 'Nike Air Force 1, Size 42',
    description: 'Original Nike Air Force 1, white, size 42. Comes with dust bag.',
    price: 25000, currency: 'NGN', priceType: 'FIXED', condition: 'NEW', status: 'ACTIVE', promotionTier: 'NONE',
    categorySlug: 'fashion', subcategorySlug: 'shoes', state: 'Lagos', lga: 'Surulere', images: demoImages('sneakers', 11),
    attributes: [{ key: 'Size', value: '42' }, { key: 'Color', value: 'White' }],
    sellerId: 's_tunde', sellerName: 'Tunde Kalu', sellerRating: 4.9, isVerifiedSeller: true, sellerPhone: '0806 345 6789',
    viewCount: 73, createdAt: iso(15 * H),
  },
  {
    id: 'l12', slug: 'skincare-bundle-set-of-5', title: 'Skincare Bundle, Set of 5',
    description: 'Complete skincare set: cleanser, toner, serum, moisturizer and sunscreen. Suitable for all skin types.',
    price: 18000, currency: 'NGN', priceType: 'FIXED', condition: 'NEW', status: 'ACTIVE', promotionTier: 'NONE',
    categorySlug: 'health-beauty', subcategorySlug: 'skin-care', state: 'Lagos', lga: 'Surulere', images: demoImages('skincare', 12),
    attributes: [{ key: 'Items', value: '5' }, { key: 'Skin Type', value: 'All' }],
    sellerId: 's_amaka', sellerName: 'Amaka Chukwu', sellerRating: 4.7, isVerifiedSeller: false, sellerPhone: '0809 678 9012',
    viewCount: 34, createdAt: iso(40 * H),
  },
  {
    id: 'l13', slug: 'graphic-designer-needed', title: 'Graphic Designer Needed',
    description: 'Hiring a mid-level graphic designer, remote-friendly, must know Figma and Adobe suite. Send portfolio.',
    price: 150000, currency: 'NGN', priceType: 'ON_REQUEST', condition: 'NEW', status: 'ACTIVE', promotionTier: 'NONE',
    categorySlug: 'jobs', subcategorySlug: 'it-software', state: 'Lagos', lga: 'Ikeja', images: demoImages('office', 13),
    attributes: [{ key: 'Type', value: 'Full-time' }, { key: 'Experience', value: '2+ years' }],
    sellerId: 's_ngozi', sellerName: 'Ngozi Eze', sellerRating: 4.3, isVerifiedSeller: false, sellerPhone: '0808 567 8901',
    viewCount: 210, createdAt: iso(1 * D),
  },
  {
    id: 'l14', slug: 'sales-representative-role', title: 'Sales Representative (Remote OK)',
    description: 'Looking for an energetic sales rep to join our FMCG distribution team. Commission plus base pay.',
    price: 120000, currency: 'NGN', priceType: 'ON_REQUEST', condition: 'NEW', status: 'ACTIVE', promotionTier: 'NONE',
    categorySlug: 'jobs', subcategorySlug: 'sales-marketing', state: 'Oyo', lga: 'Bodija', images: demoImages('office', 14),
    attributes: [{ key: 'Type', value: 'Full-time' }, { key: 'Location', value: 'Remote / Hybrid' }],
    sellerId: 's_ibrahim', sellerName: 'Ibrahim Sule', sellerRating: 4.4, isVerifiedSeller: true, sellerPhone: '0810 789 0123',
    viewCount: 66, createdAt: iso(6 * H),
  },
  {
    id: 'l15', slug: 'plumbing-pipe-fitting', title: 'Plumbing & Pipe Fitting Services',
    description: 'Professional plumbing services, pipe fitting, leak repairs and installations. Same-day response.',
    price: 5000, currency: 'NGN', priceType: 'ON_REQUEST', condition: 'NEW', status: 'ACTIVE', promotionTier: 'NONE',
    categorySlug: 'services', subcategorySlug: 'repair-services', state: 'Abuja (FCT)', lga: 'Kubwa', images: demoImages('plumber', 15),
    attributes: [{ key: 'Call-out', value: 'Same day' }],
    sellerId: 's_ibrahim', sellerName: 'Ibrahim Sule', sellerRating: 4.4, isVerifiedSeller: true, sellerPhone: '0810 789 0123',
    viewCount: 29, createdAt: iso(2 * D),
  },
  {
    id: 'l16', slug: 'land-plot-epe', title: 'Dry Land, 2 Plots, Fenced',
    description: 'Dry, fenced land measuring 100x100ft with survey and registered deed. Fast-developing neighbourhood.',
    price: 6500000, currency: 'NGN', priceType: 'NEGOTIABLE', condition: 'NEW', status: 'ACTIVE', promotionTier: 'TOP_AD',
    categorySlug: 'real-estate', subcategorySlug: 'land-plots', state: 'Lagos', lga: 'Ikorodu', images: demoImages('land', 16),
    attributes: [{ key: 'Size', value: '100 x 100 ft' }, { key: 'Title', value: 'Registered Deed' }],
    sellerId: 's_fatima', sellerName: 'Fatima Bello', sellerRating: 4.6, isVerifiedSeller: true, sellerPhone: '0805 234 5678',
    viewCount: 144, createdAt: iso(9 * H),
  },
  {
    id: 'l17', slug: 'samsung-galaxy-a54', title: 'Samsung Galaxy A54 128GB',
    description: 'Brand new, sealed. 128GB storage, 8GB RAM, comes with 1 year warranty card.',
    price: 260000, currency: 'NGN', priceType: 'FIXED', condition: 'NEW', status: 'ACTIVE', promotionTier: 'NONE',
    categorySlug: 'mobile-phones', subcategorySlug: 'smartphones', state: 'Enugu', lga: 'Enugu North', images: demoImages('smartphone', 17),
    attributes: [{ key: 'Brand', value: 'Samsung' }, { key: 'Storage', value: '128GB' }, { key: 'RAM', value: '8GB' }],
    sellerId: 's_aisha', sellerName: 'Aisha Mohammed', sellerRating: 4.2, isVerifiedSeller: false, sellerPhone: '0811 890 1234',
    viewCount: 112, createdAt: iso(4 * H),
  },
  {
    id: 'l18', slug: 'gym-fitness-equipment-set', title: 'Home Gym Fitness Equipment Set',
    description: 'Adjustable dumbbells, resistance bands and a foldable bench. Great for home workouts.',
    price: 95000, currency: 'NGN', priceType: 'NEGOTIABLE', condition: 'USED', status: 'ACTIVE', promotionTier: 'NONE',
    categorySlug: 'health-beauty', subcategorySlug: 'fitness-equipment', state: 'Delta', lga: 'Warri South', images: demoImages('gym', 18),
    attributes: [{ key: 'Items', value: '3-piece set' }],
    sellerId: 's_chidinma', sellerName: 'Chidinma Ude', sellerRating: 4.5, isVerifiedSeller: false, sellerPhone: '0807 456 7890',
    viewCount: 39, createdAt: iso(28 * H),
  },
];
