import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { CoinsService } from '../coins.service';
import { CreateCoinTransactionDto } from '../dto/create-coin-transaction.dto';
import { CreateEarnRequestDto } from '../dto/create-earn-request.dto';
import { CreateRedeemRequestDto } from '../dto/create-redeem-request.dto';
import { CoinTransactionSearchDto } from '../dto/coin-transaction-search.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('coins/transactions')
@UseGuards(JwtAuthGuard)
export class CoinTransactionController {
  constructor(private readonly coinsService: CoinsService) {}

  @Post('earn')
  async createEarnRequest(
    @Body() earnDto: CreateEarnRequestDto,
    @Request() req,
  ) {
    const userId = req.user.sub;

    const transaction = await this.coinsService.createEarnRequest(
      userId,
      earnDto,
    );

    return {
      success: true,
      message: 'Earn request submitted successfully',
      data: { transaction },
    };
  }

  @Post('redeem')
  async createRedeemRequest(
    @Body() redeemDto: CreateRedeemRequestDto,
    @Request() req,
  ) {
    const userId = req.user.sub;

    const transaction = await this.coinsService.createRedeemRequest(
      userId,
      redeemDto,
    );

    return {
      success: true,
      message: 'Redeem request submitted successfully',
      data: { transaction },
    };
  }

  @Post()
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Create a new coin transaction' })
  // @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  // @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  createTransaction(@Body() createTransactionDto: CreateCoinTransactionDto) {
    // This method is not implemented in the current CoinsService
    throw new Error('Method not implemented - use specific earn/redeem endpoints');
  }

  @Get()
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get transactions with search and pagination' })
  // @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTransactions(@Query() searchDto: CoinTransactionSearchDto, @Request() req) {
    // Use the new method signature
    const { page = 1, limit = 20 } = searchDto;
    return this.coinsService.getTransactionHistory(req.user.sub, page, limit);
  }

  @Get('my')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get current user transactions' })
  // @ApiResponse({ status: 200, description: 'User transactions retrieved successfully' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyTransactions(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.coinsService.getTransactionHistory(req.user.sub, page, limit);
  }

  @Get(':id')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get transaction by ID' })
  // @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 404, description: 'Transaction not found' })
  getTransactionById(@Param('id') id: string) {
    // This method is not implemented in the current CoinsService
    throw new Error('Method not implemented - use transaction history endpoint');
  }
}
