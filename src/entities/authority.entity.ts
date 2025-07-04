import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Role } from '../entities/role.entity';

@Entity()
export class Authority {
  @PrimaryGeneratedColumn()
  authorityId: number;

  @Column({ unique: true })
  authority: string; 

  @ManyToMany(() => Role, (role) => role.authorities)
  roles: Role[];
}
