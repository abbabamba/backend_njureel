import { Module } from '@nestjs/common';
import { WebrtcService } from './webrtc.service';
import { WebrtcGateway } from './webrtc.gateway';

@Module({
  providers: [WebrtcGateway, WebrtcService],
})
export class WebrtcModule {}
