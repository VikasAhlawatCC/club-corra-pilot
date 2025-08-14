import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtTokenService } from './jwt.service';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../common/common.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    UsersModule,
    CommonModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_REFRESH_SECRET'),
      }),
      inject: [ConfigService],
      global: true,
    }),
  ],
  providers: [
    AuthService, 
    JwtTokenService, 
    JwtStrategy, 
    LocalStrategy,
    {
      provide: 'JWT_REFRESH_SERVICE',
      useFactory: async (configService: ConfigService) => {
        const jwtService = new JwtService({
          secret: configService.get<string>('JWT_REFRESH_SECRET'),
        });
        return jwtService;
      },
      inject: [ConfigService],
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtTokenService],
})
export class AuthModule {}
