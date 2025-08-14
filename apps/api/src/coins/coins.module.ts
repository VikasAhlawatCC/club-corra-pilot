import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinsService } from './coins.service';
import { CoinBalance } from './entities/coin-balance.entity';
import { CoinTransaction } from './entities/coin-transaction.entity';
import { Brand } from '../brands/entities/brand.entity';
import { User } from '../users/entities/user.entity';
import { CoinBalanceController } from './controllers/coin-balance.controller';
import { CoinTransactionController } from './controllers/coin-transaction.controller';
import { CoinAdminController } from './controllers/coin-admin.controller';
// import { TransactionController } from './controllers/coin-transaction.controller';
import { WelcomeBonusController } from './controllers/welcome-bonus.controller';
import { WelcomeBonusService } from './services/welcome-bonus.service';
import { TransactionValidationService } from './services/transaction-validation.service';
import { BalanceUpdateService } from './services/balance-update.service';
import { CommonModule } from '../common/common.module';
import { ConfigModule } from '../config/config.module';
import { NotificationModule } from '../notifications/notification.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CoinBalance, CoinTransaction, Brand, User]),
    CommonModule,
    ConfigModule,
    NotificationModule,
    WebsocketModule,
  ],
  controllers: [
    CoinBalanceController,
    CoinTransactionController,
    CoinAdminController,
    // TransactionController,
    WelcomeBonusController,
  ],
  providers: [CoinsService, WelcomeBonusService, TransactionValidationService, BalanceUpdateService],
  exports: [CoinsService, WelcomeBonusService, TransactionValidationService, BalanceUpdateService],
})
export class CoinsModule {}
