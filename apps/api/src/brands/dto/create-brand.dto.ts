import { IsString, IsNumber, IsUUID, IsOptional, IsBoolean, Min, Max, ValidateIf } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsUUID()
  categoryId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  earningPercentage: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  redemptionPercentage: number;

  @IsNumber()
  @Min(0)
  minRedemptionAmount: number;

  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.maxRedemptionAmount !== undefined)
  @Min(0)
  maxRedemptionAmount: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
