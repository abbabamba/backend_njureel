import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({ enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE'] })
  @IsEnum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE'])
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DONE';

  @ApiProperty({ required: false, description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
