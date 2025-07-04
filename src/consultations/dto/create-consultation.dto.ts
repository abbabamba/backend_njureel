import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConsultationDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  report?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  prescription?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  diagnosis?: string;
}
