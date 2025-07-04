// src/audio-call/audio-call.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // 👈 À importer
import { AudioCallService } from './audio-call.service';

@Module({
  imports: [ConfigModule], // 👈 Ajoute ceci
  providers: [AudioCallService],
  exports: [AudioCallService],
})
export class AudioCallModule {}
