import {
  Car, Home, Smartphone, Laptop, Shirt, Briefcase, Sofa, Sparkles, Wrench, type LucideIcon,
} from 'lucide-react';
import type { CategoryIconKey } from '@shared/types';

export const CATEGORY_ICONS: Record<CategoryIconKey, LucideIcon> = {
  car: Car,
  home: Home,
  smartphone: Smartphone,
  laptop: Laptop,
  shirt: Shirt,
  briefcase: Briefcase,
  sofa: Sofa,
  sparkles: Sparkles,
  wrench: Wrench,
};
