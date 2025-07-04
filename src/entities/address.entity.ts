import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  addressId: number;

  @Column()
  street: string;

  @Column()
  city: string;

  @Column()
  zipCode: string;

  @Column()
  country: string;
}
