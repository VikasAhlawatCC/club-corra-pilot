import { IsString, IsNumber, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CoinAdjustmentDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  reason: string;
}
