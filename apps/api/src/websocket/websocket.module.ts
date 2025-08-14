import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { ConnectionManager } from './connection.manager';

@Module({
  providers: [WebsocketGateway, ConnectionManager],
  exports: [WebsocketGateway, ConnectionManager],
})
export class WebsocketModule {}
