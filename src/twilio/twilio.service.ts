import { Injectable } from '@nestjs/common';
import * as twilio from 'twilio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TwilioService {
  private readonly accountSid = process.env.TWILIO_ACCOUNT_SID!;
  private readonly apiKeySid = process.env.TWILIO_API_KEY_SID!;
  private readonly apiKeySecret = process.env.TWILIO_API_KEY_SECRET!;

  generateRoomLink(identity: string): { room: string; token: string; url: string } {
    const roomName = `consult-${uuidv4().slice(0, 8)}`;

    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = new AccessToken.VideoGrant({ room: roomName });

    const token = new AccessToken(
      this.accountSid,
      this.apiKeySid,
      this.apiKeySecret,
      {
        identity,
        ttl: 3600,
      },
    );

    token.addGrant(VideoGrant);

    return {
      room: roomName,
      token: token.toJwt(),
      url: `https://your-frontend-app.com/video/${roomName}?token=${token.toJwt()}`,
    }
  }
}
