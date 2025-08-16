import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminService } from './admin.service';
import { Admin } from './admin.entity';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { CoinBalance } from '../coins/entities/coin-balance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, User, UserProfile, CoinBalance]),
  ],
  controllers: [AdminController, AdminUsersController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
