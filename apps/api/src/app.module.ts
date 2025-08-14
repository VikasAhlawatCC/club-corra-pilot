import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BrandsModule } from './brands/brands.module';
import { CoinsModule } from './coins/coins.module';
import { ConfigModule } from './config/config.module';
import { FileModule } from './files/file.module';
import { NotificationModule } from './notifications/notification.module';
import { WebsocketModule } from './websocket/websocket.module';
import { CommonModule } from './common/common.module';
import { TypeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfig,
    }),
    CommonModule,
    HealthModule,
    AuthModule,
    UsersModule,
    BrandsModule,
    CoinsModule,
    ConfigModule,
    FileModule,
    NotificationModule,
    WebsocketModule,
  ],
})
export class AppModule {}
