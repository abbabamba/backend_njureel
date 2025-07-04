// src/consultations/consultations.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from '../entities/consultation.entity';
import { Appointment } from '../entities/appointment.entity';
import { User } from '../entities/user.entity';
import { ConsultationService } from './consultations.service';
import { ConsultationController } from './consultations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Consultation, Appointment, User])
  ],
  controllers: [ConsultationController],
  providers: [ConsultationService],
})
export class ConsultationsModule {}
