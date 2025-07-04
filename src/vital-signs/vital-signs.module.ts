import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VitalSignsService } from './vital-signs.service';
import { VitalSignsController } from './vital-signs.controller';
import { VitalSign } from './entities/vital-sign.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VitalSign, User])
  ],
  controllers: [VitalSignsController],
  providers: [VitalSignsService]
})
export class VitalSignsModule {}
