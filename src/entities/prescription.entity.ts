import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Appointment } from './appointment.entity';

@Entity()
export class Prescription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.userId)
  doctor: User; // 👈 Relation complète pour accéder à .userId, .profile, etc.

  @ManyToOne(() => User, user => user.userId)
  patient: User;

  @ManyToOne(() => Appointment, appt => appt.appointmentId, { nullable: true })
  appointment?: Appointment;

  @Column({ nullable: true })
  doctorAccountNumber?: string; // 👈 Cachet (copie figée)
}
