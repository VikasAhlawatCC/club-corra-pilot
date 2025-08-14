import { IsString, IsNumber, IsDateString, IsOptional, IsUrl, Min, Max } from 'class-validator';

export class CreateEarnRequestDto {
  @IsString()
  brandId: string;

  @IsNumber()
  @Min(0.01, { message: 'Bill amount must be greater than 0' })
  @Max(100000, { message: 'Bill amount cannot exceed 100,000' })
  billAmount: number;

  @IsDateString()
  billDate: string;

  @IsUrl()
  receiptUrl: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
