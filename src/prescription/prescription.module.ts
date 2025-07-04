
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from '../entities/prescription.entity';
import { User } from '../entities/user.entity';
import { Appointment } from '../entities/appointment.entity';
import { PrescriptionService } from './prescription.service';
import { PrescriptionController } from './prescription.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prescription, User, Appointment]) // ✅ Très important
  ],
  providers: [PrescriptionService],
  controllers: [PrescriptionController],
  exports: [PrescriptionService] // si besoin dans d'autres modules
})
export class PrescriptionModule {}
