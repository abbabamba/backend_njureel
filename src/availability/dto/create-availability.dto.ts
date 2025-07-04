import { IsNotEmpty, IsDateString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAvailabilityDto {
  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({ example: '2025-04-01T09:00:00.000Z' })
  startDate: Date;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({ example: '2025-04-01T12:00:00.000Z' })
  endDate: Date;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 1, description: 'ID du médecin' })
  doctorId: number;
}
