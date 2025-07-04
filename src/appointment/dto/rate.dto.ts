import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RateDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  rating: number;
}
