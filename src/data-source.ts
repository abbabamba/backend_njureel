import 'ts-node/register';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { Role } from './entities/role.entity';
import { Authority } from './entities/authority.entity';
import { Address } from './entities/address.entity';
import { MedicalRecord } from './entities/medical-record.entity'; 
import { VitalSigns } from './entities/vitalsigns.entity';
import { Appointment } from './entities/appointment.entity';
import { Availability } from './entities/availability.entity';
import { Consultation } from './entities/consultation.entity';

import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || '192.168.8.3',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres', 
  database: process.env.DATABASE_NAME?.toString() || 'njureel',
  entities: [User, Profile, Role, Authority, Address, MedicalRecord, VitalSigns, Appointment, Availability, Consultation],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});