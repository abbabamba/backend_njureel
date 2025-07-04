import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Profile } from './profile.entity';

@Entity()
export class Experience {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string; // Exemple : Médecin généraliste

  @Column({ nullable: true })
  institution?: string; // Ex : Hôpital Fann

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  startDate: string; 

  @Column({ nullable: true })
  endDate?: string; 

  @ManyToOne(() => Profile, (profile) => profile.experiences, {
    onDelete: 'CASCADE',
  })
  profile: Profile;
}
