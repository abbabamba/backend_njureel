import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentController } from './appointment.controller';
import { User } from '../entities/user.entity';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentService } from './appointment.service';
import { TwilioModule } from '../twilio/twilio.module';
import { NotificationModule } from '../services/notification.module';
import { AudioCallModule } from '../audio-call/audio-call.module';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, User])
  , TwilioModule, NotificationModule, AudioCallModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
