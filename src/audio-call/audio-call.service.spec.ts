import { Test, TestingModule } from '@nestjs/testing';
import { AudioCallService } from './audio-call.service';

describe('AudioCallService', () => {
  let service: AudioCallService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AudioCallService],
    }).compile();

    service = module.get<AudioCallService>(AudioCallService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
