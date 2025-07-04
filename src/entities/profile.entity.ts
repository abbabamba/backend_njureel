import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { Address } from '../entities/address.entity';
import { Experience } from './experience.entity';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  profileId: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  gender: string;

  @Column()
  birthDate: string;

  @OneToOne(() => Address, { cascade: true, eager: true })
  @JoinColumn()
  address: Address;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column({ nullable: true })
  specialty?: string;

  @Column({ nullable: true })
  experienceYears?: number;

  @Column({ nullable: true, type: 'text' })
  biography?: string;

  @Column({ nullable: true })
  clinicName?: string;

  @Column({ nullable: true })
  consultationModes?: string;

  @OneToMany(() => Experience, (experience) => experience.profile, {
    cascade: true,
    eager: true
  })
  experiences: Experience[];
}
