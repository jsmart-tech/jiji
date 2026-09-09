import { create } from 'zustand';
import type { ListingCondition, PriceType, PromotionTier } from '@shared/types';

export interface PostAdDraft {
  categorySlug: string | null;
  subcategorySlug: string | null;
  images: string[]; // data URLs from FileReader
  title: string;
  description: string;
  price: string;
  priceType: PriceType;
  condition: ListingCondition;
  state: string;
  lga: string;
  promotionTier: PromotionTier;
}

const EMPTY_DRAFT: PostAdDraft = {
  categorySlug: null,
  subcategorySlug: null,
  images: [],
  title: '',
  description: '',
  price: '',
  priceType: 'NEGOTIABLE',
  condition: 'USED',
  state: '',
  lga: '',
  promotionTier: 'NONE',
};

interface PostAdState {
  step: number;
  draft: PostAdDraft;
  setStep: (step: number) => void;
  update: (patch: Partial<PostAdDraft>) => void;
  reset: () => void;
}

export const usePostAdStore = create<PostAdState>()((set) => ({
  step: 0,
  draft: { ...EMPTY_DRAFT },
  setStep: (step) => set({ step }),
  update: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  reset: () => set({ step: 0, draft: { ...EMPTY_DRAFT } }),
}));
