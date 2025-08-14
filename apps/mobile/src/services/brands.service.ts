import { 
  brandListResponseSchema, 
  brandSearchSchema, 
  brandSchema,
  brandCategorySchema
} from '@shared/schemas';
import type { z } from 'zod';

type BrandListResponse = z.infer<typeof brandListResponseSchema>;
type BrandSearch = z.infer<typeof brandSearchSchema>;
type Brand = z.infer<typeof brandSchema>;
type BrandCategory = z.infer<typeof brandCategorySchema>;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.5:3001';

class BrandsService {
  private lastSearchTime = 0;
  private readonly SEARCH_RATE_LIMIT = 500; // 500ms between searches

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/brands/${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        'X-Client-Type': 'mobile',
        'User-Agent': 'ClubCorra-Mobile/1.0.0',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.lastSearchTime < this.SEARCH_RATE_LIMIT) {
      return false;
    }
    this.lastSearchTime = now;
    return true;
  }

  async getBrands(searchParams: BrandSearch = { page: 1, limit: 20 }): Promise<BrandListResponse> {
    const queryString = new URLSearchParams();
    
    if (searchParams.query) queryString.append('query', searchParams.query);
    if (searchParams.categoryId) queryString.append('categoryId', searchParams.categoryId);
    if (searchParams.isActive !== undefined) queryString.append('isActive', searchParams.isActive.toString());
    if (searchParams.page) queryString.append('page', searchParams.page.toString());
    if (searchParams.limit) queryString.append('limit', searchParams.limit.toString());

    const endpoint = queryString.toString() ? `?${queryString.toString()}` : '';
    const response = await this.makeRequest(endpoint);
    
    return brandListResponseSchema.parse(response);
  }

  async getBrandById(brandId: string): Promise<Brand> {
    const response = await this.makeRequest(brandId);
    return brandSchema.parse(response);
  }

  async searchBrands(query: string, categoryId?: string): Promise<BrandListResponse> {
    if (!this.checkRateLimit()) {
      throw new Error('Search rate limit exceeded. Please wait before searching again.');
    }

    const searchParams: BrandSearch = {
      query,
      categoryId,
      isActive: true,
      page: 1,
      limit: 20,
    };
    
    return this.getBrands(searchParams);
  }

  async getBrandsByCategory(categoryId: string): Promise<BrandListResponse> {
    if (!this.checkRateLimit()) {
      throw new Error('Search rate limit exceeded. Please wait before searching again.');
    }

    const searchParams: BrandSearch = {
      categoryId,
      isActive: true,
      page: 1,
      limit: 50,
    };
    
    return this.getBrands(searchParams);
  }

  async getBrandCategories(): Promise<BrandCategory[]> {
    const response = await this.makeRequest('categories');
    // Validate the response with the schema
    return brandCategorySchema.array().parse(response);
  }
}

export const brandsService = new BrandsService();
