import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UserProfile } from './entities/user-profile.entity';
import { PaymentDetails } from './entities/payment-details.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    return {
      id: user.id,
      mobileNumber: user.mobileNumber,
      email: user.email,
      status: user.status,
      isMobileVerified: user.isMobileVerified,
      isEmailVerified: user.isEmailVerified,
      profile: user.profile,
      paymentDetails: user.paymentDetails,
    };
  }

  @Put('profile')
  async updateProfile(
    @Request() req,
    @Body() profileData: Partial<UserProfile>,
  ) {
    // Remove userId from profileData if present
    const { userId, ...cleanProfileData } = profileData;
    
    const updatedProfile = await this.usersService.updateProfile(
      req.user.id,
      cleanProfileData,
    );

    return {
      message: 'Profile updated successfully',
      profile: updatedProfile,
    };
  }

  @Put('payment-details')
  async updatePaymentDetails(
    @Request() req,
    @Body() paymentData: Partial<PaymentDetails>,
  ) {
    // Remove userId from paymentData if present
    const { userId, ...cleanPaymentData } = paymentData;
    
    const updatedPaymentDetails = await this.usersService.updatePaymentDetails(
      req.user.id,
      cleanPaymentData,
    );

    return {
      message: 'Payment details updated successfully',
      paymentDetails: updatedPaymentDetails,
    };
  }
}
