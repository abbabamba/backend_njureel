import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'La date et l\'heure du rendez-vous',
    type: String,
    example: '2025-03-30T10:00:00Z',
  })
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({
    description: 'La durée du rendez-vous en minutes',
    type: Number,
    example: 30,
  })
  @IsInt()
  duration: number;

  @ApiProperty({
    description: 'Le type du rendez-vous (Visio, Téléphone, Présentiel)',
    enum: ['VIDEO', 'PHONE', 'PRESENTIEL'],
    example: 'VIDEO',
  })
  @IsEnum(['VIDEO', 'PHONE', 'PRESENTIEL'])
  type: 'VIDEO' | 'PHONE' | 'PRESENTIEL';

  @ApiProperty({
    description: 'La raison du rendez-vous (facultatif)',
    required: false,
    type: String,
    example: 'Consultation pour la grippe',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'ID du patient',
    type: Number,
    example: 1,
  })
  @IsInt()
  patientId: number;

  @ApiProperty({
    description: 'ID du médecin',
    type: Number,
    example: 2,
  })
  @IsInt()
  doctorId: number;

  // Calcul de la date de fin
  @ApiProperty({
    description: 'Date de fin calculée automatiquement à partir de la date de début et de la durée',
    type: String,
    example: '2025-03-30T10:30:00Z',
  })
  endDate: string;

  constructor(appointmentDate: string, duration: number) {
    this.appointmentDate = appointmentDate;
    this.duration = duration;
    const startDate = new Date(appointmentDate);
    startDate.setMinutes(startDate.getMinutes() + duration);  // Ajouter la durée au créneau
    this.endDate = startDate.toISOString();
  }
}
