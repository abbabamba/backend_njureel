import { IsOptional, IsDateString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAvailabilityDto {
  @IsDateString()
  @IsOptional()
  @ApiProperty({ example: '2025-04-01T09:00:00.000Z', required: false })
  startDate?: Date;

  @IsDateString()
  @IsOptional()
  @ApiProperty({ example: '2025-04-01T12:00:00.000Z', required: false })
  endDate?: Date;

  @IsInt()
  @IsOptional()
  @ApiProperty({ example: 1, description: 'ID du médecin', required: false })
  doctorId?: number;
}
