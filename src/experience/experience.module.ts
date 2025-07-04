import { Module } from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { ExperienceController } from './experience.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Experience } from '../entities/experience.entity';
import { Profile } from '../entities/profile.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Experience, Profile, User])],
  controllers: [ExperienceController],
  providers: [ExperienceService],
})
export class ExperienceModule {}
