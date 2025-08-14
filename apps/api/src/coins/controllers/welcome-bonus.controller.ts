import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WelcomeBonusService } from '../services/welcome-bonus.service';
import { WelcomeBonusRequest, WelcomeBonusResponse } from '@shared/schemas/coin.schema';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('welcome-bonus')
@UseGuards(JwtAuthGuard)
export class WelcomeBonusController {
  constructor(private readonly welcomeBonusService: WelcomeBonusService) {}

  /**
   * Process welcome bonus for authenticated user
   * POST /welcome-bonus
   */
  @Post()
  async processWelcomeBonus(
    @Body() request: WelcomeBonusRequest,
    @Request() req: any,
  ): Promise<WelcomeBonusResponse> {
    // Ensure the user can only process their own welcome bonus
    if (request.userId !== req.user.sub) {
      throw new Error('Unauthorized: Cannot process welcome bonus for another user');
    }

    return this.welcomeBonusService.processWelcomeBonus(request);
  }
}
