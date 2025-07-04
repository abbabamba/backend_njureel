import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Address } from './address.entity';
import { Role } from './role.entity';
import { MedicalRecord } from './medical-record.entity';
import { Appointment } from './appointment.entity';
import { Availability } from './availability.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column()
  password: string;

  @Column({ nullable: true, unique: true })
  phoneNumber?: string;

  @Column({ nullable: true, unique: true })
  accountNumber?: string; // Numéro de registre médical pour les médecins

  @Column({ default: false })
  validated: boolean; // Si le médecin est validé ou non par l'admin

  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date | null;

  @Column({ default: true })
  accountNonExpired: boolean;

  @Column({ default: true })
  accountNonLocked: boolean;

  @Column({ default: true })
  credentialsNonExpired: boolean;

  @Column({ default: true })
  enabled: boolean;

  @OneToOne(() => Profile, { cascade: true, eager: false })  
  @JoinColumn()
  profile: Profile;

  @OneToOne(() => Address, { cascade: true, eager: false })  
  @JoinColumn()
  address: Address;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable()
  roles: Role[];

  @OneToOne(() => MedicalRecord, { cascade: true, eager: false })  
  @JoinColumn()
  medicalRecord: MedicalRecord; // Dossier médical pour les patients

  @OneToMany(() => Appointment, (appt) => appt.patient, { eager: false })
  patientAppointments: Appointment[];

  @OneToMany(() => Appointment, (appt) => appt.doctor, { eager: false })  
  doctorAppointments: Appointment[];


  @OneToMany(() => User, (patient) => patient.medecinReferent, { eager: false })  // Désactivation de eager
  patientsSuivis: User[]; 

  @ManyToOne(() => User, (medecin) => medecin.patientsSuivis, { nullable: true, eager: false })  // Désactivation de eager
  @JoinColumn({ name: 'medecinReferentId' })
  medecinReferent: User; // ✅ Médecin référent du patient

  @Column({ nullable: true })
  medecinReferentId?: number;

  @OneToMany(() => Availability, availability => availability.doctor, { eager: false })  // Désactivation de eager
  availabilities: Availability[];

}
