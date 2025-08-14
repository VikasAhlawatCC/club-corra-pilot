import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CommonModule } from '../common/common.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [CommonModule, WebsocketModule],
  controllers: [HealthController],
})
export class HealthModule {}
