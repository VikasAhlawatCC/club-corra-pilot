import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { CreateCoinTransactionDto } from './dto/create-coin-transaction.dto';
import { CoinTransactionSearchDto } from './dto/coin-transaction-search.dto';
import { WelcomeBonusDto } from './dto/welcome-bonus.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Post('welcome-bonus')
  @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Create welcome bonus for new user' })
  // @ApiResponse({ status: 201, description: 'Welcome bonus created successfully' })
  // @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 409, description: 'Welcome bonus already given' })
  createWelcomeBonus(@Body() welcomeBonusDto: WelcomeBonusDto) {
    return this.coinsService.createWelcomeBonus(welcomeBonusDto);
  }

  @Post('transaction')
  @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Create a new coin transaction' })
  // @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  // @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  createTransaction(@Body() createTransactionDto: CreateCoinTransactionDto) {
    // This method doesn't exist in the service, need to implement or remove
    throw new Error('Method not implemented');
  }

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get current user coin balance' })
  // @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  getBalance(@Request() req) {
    return this.coinsService.getUserBalance(req.user.sub);
  }

  @Get('balance/:userId')
  @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get coin balance for specific user (admin only)' })
  // @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  getUserBalance(@Param('userId') userId: string) {
    return this.coinsService.getUserBalance(userId);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get transactions with search and pagination' })
  // @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTransactions(@Query() searchDto: CoinTransactionSearchDto, @Request() req) {
    const { page = 1, limit = 20 } = searchDto;
    return this.coinsService.getTransactionHistory(req.user.sub, page, limit);
  }

  @Get('transactions/my')
  @UseGuards(JwtAuthGuard)
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

  @Get('transactions/:id')
  @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get transaction by ID' })
  // @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 404, description: 'Transaction not found' })
  getTransactionById(@Param('id') id: string) {
    // This method doesn't exist in the service, need to implement or remove
    throw new Error('Method not implemented');
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get current user transaction summary' })
  // @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTransactionSummary(@Request() req) {
    // This method doesn't exist in the service, need to implement or remove
    throw new Error('Method not implemented');
  }

  @Get('summary/:userId')
  @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get transaction summary for specific user (admin only)' })
  // @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  getUserTransactionSummary(@Param('userId') userId: string) {
    // This method doesn't exist in the service, need to implement or remove
    throw new Error('Method not implemented');
  }
}
