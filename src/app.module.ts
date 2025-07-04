import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { VitalSignsModule } from './vital-signs/vital-signs.module';
import { AppointmentModule } from './appointment/appointment.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { AvailabilityModule } from './availability/availability.module';
import { ExperienceModule } from './experience/experience.module';
import { PrescriptionModule } from './prescription/prescription.module';
import { AudioCallModule } from './audio-call/audio-call.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), 
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
        maxAge: '1d',
      },
    }),
    
    VitalSignsModule,
    
    AppointmentModule,
    ConsultationsModule,
    AvailabilityModule,
    ExperienceModule,
    PrescriptionModule,
    AudioCallModule,
  ],
})
export class AppModule {}
