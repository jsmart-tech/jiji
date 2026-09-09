import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';

const POPULAR_CATEGORIES = [
  { slug: 'vehicles', name: 'Vehicles' },
  { slug: 'real-estate', name: 'Real Estate' },
  { slug: 'mobile-phones', name: 'Mobile Phones & Tablets' },
  { slug: 'electronics', name: 'Electronics' },
  { slug: 'fashion', name: 'Fashion' },
  { slug: 'jobs', name: 'Jobs' },
];

const QUICK_LINKS = [
  { href: '/', name: 'Home' },
  { href: '/categories', name: 'All Categories' },
  { href: '/post-ad', name: 'Post an Ad' },
  { href: '/chat', name: 'Messages' },
  { href: '/account', name: 'My Account & Saved Ads' },
];

export function Footer() {
  return (
    <footer className="hidden bg-ink text-white/80 sm:block">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-2xl font-extrabold tracking-tight text-white">Jsmart</span>
            <p className="max-w-xs text-sm leading-relaxed text-white/60">
              Buy and sell anything, right in your city. Thousands of listings across vehicles,
              property, phones, fashion and more.
            </p>
            <div className="mt-1 flex gap-3">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-white/50">Popular Categories</h3>
            <ul className="flex flex-col gap-2.5">
              {POPULAR_CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/category/${cat.slug}`} className="text-sm text-white/70 hover:text-brand-light">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-white/50">Quick Links</h3>
            <ul className="flex flex-col gap-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 hover:text-brand-light">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Jsmart. Built as a demo marketplace &mdash; not affiliated with jiji.ng.</p>
          <p>Prices shown in Nigerian Naira (&#8358;)</p>
        </div>
      </div>
    </footer>
  );
}
