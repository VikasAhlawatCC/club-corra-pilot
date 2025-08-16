import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CoinsService } from '../coins.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('coin-balance')
@Controller('coins/balance')
export class CoinBalanceController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user coin balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(@Request() req) {
    console.log('[CoinBalanceController] Getting balance for user:', req.user.sub);
    const balance = await this.coinsService.getUserBalance(req.user.sub);
    console.log('[CoinBalanceController] Raw balance from service:', balance);
    console.log('[CoinBalanceController] Balance type:', typeof balance.balance);
    console.log('[CoinBalanceController] Balance value:', balance.balance);
    return balance;
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coin balance for specific user (admin only)' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserBalance(@Param('userId') userId: string) {
    return this.coinsService.getUserBalance(userId);
  }
}
