import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVitalSignDto {
  @ApiProperty({
    description: 'Pression artérielle (ex: "120/80")',
    example: '120/80'
  })
  @IsString()
  bloodPressure: string;

  @ApiProperty({
    description: 'Fréquence cardiaque en battements par minute',
    example: 75
  })
  @IsNumber()
  heartRate: number;

  @ApiProperty({
    description: 'Température corporelle en degrés Celsius',
    example: 36.7
  })
  @IsNumber()
  temperature: number;

  @ApiProperty({
    description: 'Taux de sucre dans le sang (glycémie)',
    example: 95
  })
  @IsNumber()
  bloodSugar: number;

  @ApiPropertyOptional({
    description: 'Date et heure de l\'enregistrement',
    example: '2025-03-30T08:30:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  recordedAt?: Date;
}
