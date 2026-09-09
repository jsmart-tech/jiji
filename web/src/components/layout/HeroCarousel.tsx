'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

interface Slide {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
  /** Opaque fallback shown if the photo fails to load — same look as before. */
  gradient: string;
  /** Semi-transparent tint painted over the photo so text stays readable. */
  overlay: string;
  image: string;
  /** false = light background, use dark text/inverted controls */
  dark?: boolean;
}

const SLIDES: Slide[] = [
  {
    id: 'general',
    eyebrow: "Nigeria's #1 Marketplace",
    title: 'Buy & sell anything, right in your city',
    body: 'Thousands of listings across cars, property, phones, fashion and more.',
    cta: { label: 'Start Browsing', href: '/categories' },
    gradient: 'from-brand to-brand-dark',
    overlay: 'from-brand/90 via-brand-dark/70 to-brand-dark/85',
    image: 'https://loremflickr.com/1600/500/marketplace?lock=101',
  },
  {
    id: 'sell',
    eyebrow: 'Got something lying around?',
    title: 'Turn your clutter into cash today',
    body: 'Posting an ad takes less than two minutes — reach buyers near you instantly.',
    cta: { label: 'Post a Free Ad', href: '/post-ad' },
    gradient: 'from-accent-dark to-accent',
    overlay: 'from-accent-dark/85 via-accent/70 to-accent/85',
    image: 'https://loremflickr.com/1600/500/boxes?lock=102',
    dark: false,
  },
  {
    id: 'vehicles',
    eyebrow: 'Ready for a new ride?',
    title: 'Thousands of verified vehicles waiting for you',
    body: 'From budget hatchbacks to executive SUVs — find your next car today.',
    cta: { label: 'Browse Vehicles', href: '/category/vehicles' },
    gradient: 'from-ink to-brand-dark',
    overlay: 'from-ink/85 via-ink/60 to-brand-dark/80',
    image: 'https://loremflickr.com/1600/500/car?lock=103',
  },
  {
    id: 'trust',
    eyebrow: 'Shop with confidence',
    title: 'Verified sellers. Real ratings. Safer deals.',
    body: "Every review comes from a real buyer, so you know who you're dealing with.",
    cta: { label: 'Explore Listings', href: '/search' },
    gradient: 'from-brand-dark via-brand to-emerald-600',
    overlay: 'from-brand-dark/85 via-brand/65 to-emerald-700/80',
    image: 'https://loremflickr.com/1600/500/handshake?lock=104',
  },
];

const AUTO_ADVANCE_MS = 5000;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Auto-advance always runs (pausable on hover) — reduced motion only turns
  // off the sliding *animation* below, not the rotation itself, per WCAG's
  // pause/stop/hide guidance for auto-updating content.
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [paused]);

  const activeIsLight = SLIDES[index].dark === false;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={clsx('flex', !reducedMotion && 'transition-transform duration-700 ease-out')}
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((slide) => {
          const imageOk = !failedImages.has(slide.id);
          return (
            <div
              key={slide.id}
              className={clsx(
                'relative flex min-h-[200px] w-full shrink-0 flex-col justify-center overflow-hidden bg-gradient-to-r sm:min-h-[240px]',
                slide.gradient,
              )}
            >
              {imageOk && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.image}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setFailedImages((prev) => new Set(prev).add(slide.id))}
                />
              )}
              {imageOk && (
                <div className={clsx('absolute inset-0 bg-gradient-to-r', slide.overlay)} />
              )}

              <div className={clsx('relative p-6 sm:p-8', slide.dark === false ? 'text-ink' : 'text-white')}>
                <p className={clsx('mb-1 text-xs font-bold uppercase tracking-wide', slide.dark === false ? 'text-ink/70' : 'text-white/80')}>
                  {slide.eyebrow}
                </p>
                <p className="max-w-md text-2xl font-extrabold leading-tight drop-shadow-sm sm:text-3xl">
                  {slide.title}
                </p>
                <p className={clsx('mt-2 max-w-sm text-sm', slide.dark === false ? 'text-ink/70' : 'text-white/90')}>
                  {slide.body}
                </p>
                {slide.cta && (
                  <Link
                    href={slide.cta.href}
                    className={clsx(
                      'mt-4 inline-flex w-fit items-center rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition-colors',
                      slide.dark === false ? 'bg-ink text-white hover:bg-ink/90' : 'bg-white text-brand-dark hover:bg-white/90',
                    )}
                  >
                    {slide.cta.label}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Go to slide ${i + 1}: ${slide.title}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={clsx(
              'h-1.5 rounded-full transition-all',
              i === index ? 'w-6' : 'w-1.5 opacity-50',
              activeIsLight ? 'bg-ink' : 'bg-white',
            )}
          />
        ))}
      </div>
    </div>
  );
}
