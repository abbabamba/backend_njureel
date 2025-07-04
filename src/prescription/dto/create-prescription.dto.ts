// src/prescription/dto/create-prescription.dto.ts

import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePrescriptionDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  content: string;

  @IsNumber()
  patientId: number;

  @IsNumber()
  appointmentId: number;

  @IsOptional()
  doctorAccountNumber?: string; // tu peux l’envoyer ou bien le déduire côté service
}
