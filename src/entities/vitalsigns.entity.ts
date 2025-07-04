import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('vital_signs')
export class VitalSigns {
  @PrimaryGeneratedColumn()
  signId: number;

  @Column()
  bloodPressure: string;

  @Column('decimal', { precision: 5, scale: 2 })
  heartRate: number;

  @Column('decimal', { precision: 5, scale: 2 })
  temperature: number;

  @Column('decimal', { precision: 5, scale: 2 })
  bloodSugar: number;

  @CreateDateColumn()
  recordedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
