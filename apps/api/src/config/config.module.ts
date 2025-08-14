import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalConfig } from './entities/global-config.entity';
import { GlobalConfigService } from './services/global-config.service';
import { ConfigController } from './config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GlobalConfig])],
  controllers: [ConfigController],
  providers: [GlobalConfigService],
  exports: [GlobalConfigService],
})
export class ConfigModule {}
