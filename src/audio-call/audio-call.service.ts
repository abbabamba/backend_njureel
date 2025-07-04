import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AudioCallService {
  private readonly audioCallServiceUrl: string;
  private readonly logger = new Logger(AudioCallService.name);

  constructor(private configService: ConfigService) {
    const serviceUrl = this.configService.get<string>('AUDIO_CALL_SERVICE_URL');
    if (!serviceUrl) {
      this.logger.error('AUDIO_CALL_SERVICE_URL is not defined in environment variables.');
      throw new Error('AUDIO_CALL_SERVICE_URL environment variable is missing.');
    }
    this.audioCallServiceUrl = serviceUrl;
  }

  async createAudioRoom(): Promise<string> {
    try {
      this.logger.log(`Attempting to create audio room at: ${this.audioCallServiceUrl}/create-audio-room`);
      const response = await axios.post<{ roomId: string }>(
        `${this.audioCallServiceUrl}/create-audio-room`,
        {}
      );

      if (response.status === 201 && response.data?.roomId) {
        this.logger.log(`Audio room created successfully: ${response.data.roomId}`);
        return response.data.roomId;
      } else {
        this.logger.error(`Failed to create audio room. Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
        throw new InternalServerErrorException('Failed to create audio room from microservice.');
      }
    } catch (error) {
      this.logger.error(`Error creating audio room: ${error.message}`, error.stack);

      if (error.response) {
        this.logger.error(`Audio Call Service Error Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        throw new InternalServerErrorException(`Audio Call Service responded with error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        this.logger.error('No response received from Audio Call Service. Is it running?');
        throw new InternalServerErrorException('No response received from Audio Call Service. Please check its availability.');
      } else {
        this.logger.error(`Error setting up request to Audio Call Service: ${error.message}`);
        throw new InternalServerErrorException('Error setting up request to Audio Call Service.');
      }
    }
  }
}
