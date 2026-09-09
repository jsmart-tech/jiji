import type { Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    slug: 'vehicles',
    name: 'Vehicles',
    icon: 'car',
    subcategories: [
      { slug: 'cars', name: 'Cars' },
      { slug: 'buses-microbuses', name: 'Buses & Microbuses' },
      { slug: 'motorcycles-scooters', name: 'Motorcycles & Scooters' },
      { slug: 'trucks-trailers', name: 'Trucks & Trailers' },
      { slug: 'vehicle-parts', name: 'Vehicle Parts & Accessories' },
    ],
  },
  {
    slug: 'real-estate',
    name: 'Real Estate',
    icon: 'home',
    subcategories: [
      { slug: 'houses-apartments-rent', name: 'Houses & Apartments for Rent' },
      { slug: 'houses-apartments-sale', name: 'Houses & Apartments for Sale' },
      { slug: 'land-plots', name: 'Land & Plots for Sale' },
      { slug: 'commercial-property', name: 'Commercial Property' },
      { slug: 'short-let', name: 'Short-let Apartments' },
    ],
  },
  {
    slug: 'mobile-phones',
    name: 'Mobile Phones & Tablets',
    icon: 'smartphone',
    subcategories: [
      { slug: 'smartphones', name: 'Smartphones' },
      { slug: 'tablets', name: 'Tablets' },
      { slug: 'phone-accessories', name: 'Phone Accessories' },
      { slug: 'mobile-services', name: 'Mobile Phone Services' },
    ],
  },
  {
    slug: 'electronics',
    name: 'Electronics',
    icon: 'laptop',
    subcategories: [
      { slug: 'tvs', name: 'TVs' },
      { slug: 'audio-music', name: 'Audio & Music Equipment' },
      { slug: 'computers-laptops', name: 'Computers & Laptops' },
      { slug: 'cameras', name: 'Cameras' },
      { slug: 'video-games', name: 'Video Games & Consoles' },
    ],
  },
  {
    slug: 'fashion',
    name: 'Fashion',
    icon: 'shirt',
    subcategories: [
      { slug: 'womens-clothing', name: "Women's Clothing" },
      { slug: 'mens-clothing', name: "Men's Clothing" },
      { slug: 'shoes', name: 'Shoes' },
      { slug: 'bags', name: 'Bags' },
      { slug: 'jewellery-watches', name: 'Jewellery & Watches' },
    ],
  },
  {
    slug: 'jobs',
    name: 'Jobs',
    icon: 'briefcase',
    subcategories: [
      { slug: 'sales-marketing', name: 'Sales & Marketing' },
      { slug: 'it-software', name: 'IT & Software' },
      { slug: 'customer-service', name: 'Customer Service' },
      { slug: 'transportation', name: 'Transportation' },
      { slug: 'remote-jobs', name: 'Remote Jobs' },
    ],
  },
  {
    slug: 'home-furniture',
    name: 'Home & Furniture',
    icon: 'sofa',
    subcategories: [
      { slug: 'furniture', name: 'Furniture' },
      { slug: 'home-appliances', name: 'Home Appliances' },
      { slug: 'kitchen-dining', name: 'Kitchen & Dining' },
      { slug: 'home-decor', name: 'Home Decor' },
    ],
  },
  {
    slug: 'health-beauty',
    name: 'Health & Beauty',
    icon: 'sparkles',
    subcategories: [
      { slug: 'skin-care', name: 'Skin Care' },
      { slug: 'makeup', name: 'Makeup' },
      { slug: 'hair', name: 'Hair' },
      { slug: 'fitness-equipment', name: 'Fitness Equipment' },
    ],
  },
  {
    slug: 'services',
    name: 'Services',
    icon: 'wrench',
    subcategories: [
      { slug: 'repair-services', name: 'Repair Services' },
      { slug: 'cleaning-services', name: 'Cleaning Services' },
      { slug: 'event-services', name: 'Event Services' },
      { slug: 'tutoring-classes', name: 'Tutoring & Classes' },
    ],
  },
];
