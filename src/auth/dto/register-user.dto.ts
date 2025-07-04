import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddressDto } from './address-user.dto';


export class RegisterUserDto {
  @ApiProperty({ example: 'PATIENT', description: 'Rôle : PATIENT ou MEDECIN' })
  @IsNotEmpty({ message: "Le rôle est obligatoire." })
  role: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: "L'email doit être valide." })
  email?: string;

  @ApiProperty({ example: 'monmotdepasse123' })
  @IsNotEmpty({ message: "Le mot de passe est obligatoire." })
  @MinLength(8, { message: "Le mot de passe doit contenir au moins 8 caractères." })
  password: string;

  @ApiProperty({ example: '+221771112233', required: false })
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: 'Awa' })
  @IsNotEmpty({ message: "Le prénom est obligatoire." })
  firstName: string;

  @ApiProperty({ example: 'Diouf' })
  @IsNotEmpty({ message: "Le nom est obligatoire." })
  lastName: string;

  @ApiProperty({ example: 'female', enum: ['male', 'female', 'other'] })
  @IsNotEmpty({ message: "Le genre est obligatoire." })
  gender: string;

  @ApiProperty({ example: '1990-04-25', description: 'Format AAAA-MM-JJ' })
  @IsNotEmpty({ message: "La date de naissance est obligatoire." })
  birthDate: string;

  @ApiProperty({ type: AddressDto })
  @IsNotEmpty({ message: "L'adresse est obligatoire." })
  address: AddressDto;
}
