// src/auth/dto/create-patient.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressDto } from './address-user.dto';

export class CreatePatientDto {
  @ApiPropertyOptional({
    example: 'patient@example.com',
    description: "Email du patient (facultatif)",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '+221771234567',
    description: "Numéro de téléphone du patient (obligatoire)",
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    example: 'Fatou',
    description: "Prénom du patient",
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Diop',
    description: "Nom de famille du patient",
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'FEMME',
    description: "Genre du patient (HOMME ou FEMME)",
  })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({
    example: '1990-06-15',
    description: "Date de naissance du patient (format YYYY-MM-DD)",
  })
  @IsString()
  @IsNotEmpty()
  birthDate: string;

  @ApiProperty({
    type: AddressDto,
    description: "Adresse du patient",
  })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty({ message: "L'adresse est obligatoire." })
  address: AddressDto;
}
