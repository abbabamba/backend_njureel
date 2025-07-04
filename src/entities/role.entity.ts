import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { User } from '../entities/user.entity';
import { Authority } from '../entities/authority.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  roleId: number;

  
  @Column({ unique: true })
  roleName: string;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @ManyToMany(() => Authority, (authority) => authority.roles)
  authorities: Authority[];
}
