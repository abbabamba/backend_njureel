import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../entities/user.entity';
import { Appointment } from './appointment.entity';

@Entity()
export class Consultation {
  @PrimaryGeneratedColumn()
  consultationId: number;

  @Column({ type: 'text', nullable: true })
  report: string;

  @Column({ type: 'text', nullable: true })
  prescription: string;

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @ManyToOne(() => User, { eager: true })
  patient: User;

  @ManyToOne(() => User, { eager: true })
  doctor: User;

  @OneToOne(() => Appointment, (appointment) => appointment.consultation)
  @JoinColumn()
  appointment: Appointment;
}
