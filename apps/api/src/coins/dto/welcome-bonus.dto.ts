import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class WelcomeBonusDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  mobileNumber: string;
}
