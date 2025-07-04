import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { User } from '../entities/user.entity';

@Entity()
export class MedicalRecord {
  @PrimaryGeneratedColumn()
  recordId: number;

  @Column({ nullable: true })
  bloodType: string; // Groupe sanguin

  @Column({ nullable: true })
  allergies: string; // Allergies connues

  @Column({ nullable: true })
  chronicDiseases: string; // Pathologies chroniques

  @Column({ nullable: true })
  treatments: string; // Traitements en cours

  @OneToOne(() => User, (user) => user.medicalRecord)
  user: User;
}
