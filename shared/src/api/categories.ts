import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { CATEGORIES } from '../mock/categories.mock';
import type { Category } from '../types';

interface CategoryRow {
  slug: string;
  name: string;
  icon: Category['icon'];
  sort_order: number;
  subcategories: { slug: string; name: string }[];
}

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('categories')
      .select('slug, name, icon, sort_order, subcategories(slug, name)')
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as CategoryRow[]).map((row) => ({
      slug: row.slug,
      name: row.name,
      icon: row.icon,
      subcategories: row.subcategories,
    }));
  }

  return CATEGORIES;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
