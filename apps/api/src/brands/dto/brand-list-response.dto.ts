import { Brand } from '../entities/brand.entity';

export class BrandListResponseDto {
  data: Brand[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
