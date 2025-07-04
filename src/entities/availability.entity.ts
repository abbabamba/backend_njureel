import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity()
export class Availability {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column({ type: 'timestamp' })
  @ApiProperty({ example: '2025-04-01T09:00:00.000Z' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  @ApiProperty({ example: '2025-04-01T12:00:00.000Z' })
  endDate: Date;

  @ManyToOne(() => User, (user) => user.availabilities, { eager: true })
  @ApiProperty({ type: () => User })
  doctor: User;
}
