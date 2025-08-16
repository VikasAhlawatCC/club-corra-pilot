import { create } from 'zustand';
import { brandsService } from '../services/brands.service';
import { brandSchema, brandCategorySchema } from '@shared/schemas';
import type { z } from 'zod';

type Brand = z.infer<typeof brandSchema>;
type BrandCategory = z.infer<typeof brandCategorySchema>;

interface BrandsState {
  brands: Brand[];
  categories: BrandCategory[];
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  
  // Actions
  fetchBrands: (searchParams?: any) => Promise<void>;
  fetchBrandById: (id: string) => Promise<Brand | null>;
  searchBrands: (query: string, categoryId?: string) => Promise<void>;
  fetchBrandsByCategory: (categoryId: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  brands: [],
  categories: [],
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

export const useBrandsStore = create<BrandsState>((set, get) => ({
  ...initialState,

  fetchBrands: async (searchParams = { page: 1, limit: 20 }) => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔍 Fetching brands with params:', searchParams);
      const response = await brandsService.getBrands(searchParams);
      console.log('✅ Brands response:', response);
      
      set({
        brands: response.brands,
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        isLoading: false,
      });
      console.log('📱 Brands state updated with', response.brands?.length || 0, 'brands');
    } catch (error) {
      console.error('❌ Error fetching brands:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch brands',
        isLoading: false 
      });
    }
  },

  fetchBrandById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const brand = await brandsService.getBrandById(id);
      set({ isLoading: false });
      return brand;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch brand',
        isLoading: false 
      });
      return null;
    }
  },

  searchBrands: async (query: string, categoryId?: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await brandsService.searchBrands(query, categoryId);
      
      set({
        brands: response.brands,
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        isLoading: false,
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to search brands',
        isLoading: false 
      });
    }
  },

  fetchBrandsByCategory: async (categoryId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await brandsService.getBrandsByCategory(categoryId);
      
      set({
        brands: response.brands,
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        isLoading: false,
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch brands by category',
        isLoading: false 
      });
    }
  },

  fetchCategories: async () => {
    try {
      set({ isLoading: true, error: null });
      const categories = await brandsService.getBrandCategories();
      set({ categories, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        isLoading: false 
      });
    }
  },

  clearError: () => set({ error: null }),
  
  reset: () => set(initialState),
}));
