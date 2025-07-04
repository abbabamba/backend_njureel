import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { User } from '../entities/user.entity';
import { Availability } from '../entities/availability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Availability, User])],
  providers: [AvailabilityService],
  controllers: [AvailabilityController],
})
export class AvailabilityModule {}
