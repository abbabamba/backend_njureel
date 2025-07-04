import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn } from 'typeorm';
import { Consultation } from './consultation.entity';
import { User } from './user.entity';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  appointmentId: number;

  @Column('timestamp')
  appointmentDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column('int')
  duration: number;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DONE';

  @Column({
    type: 'enum',
    enum: ['VIDEO', 'PHONE', 'PRESENTIEL'],
    default: 'VIDEO',
  })
  type: 'VIDEO' | 'PHONE' | 'PRESENTIEL';

  @Column({ nullable: true })
  visioLink?: string;

  @Column({ nullable: true })
  reason?: string;

  @Column({ nullable: true })
  cancellationReason?: string; 

  @Column({ type: 'int', nullable: true })
  patientRating?: number;

  @Column({ type: 'int', nullable: true })
  doctorRating?: number;

  @ManyToOne(() => User, (user) => user.patientAppointments, { eager: false })  // Désactiver eager pour éviter la récursion
  patient: User;

  @ManyToOne(() => User, (user) => user.doctorAppointments, { eager: false })  // Désactiver eager pour éviter la récursion
  doctor: User;

  @OneToOne(() => Consultation, (consultation) => consultation.appointment, {
    cascade: true,
    eager: false,  // Désactiver eager pour éviter la récursion
  })
  consultation: Consultation;

  @CreateDateColumn()
  createdAt: Date;
}
