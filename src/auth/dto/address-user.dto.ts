import { ApiProperty } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ example: '2 Voie SIPRES', description: 'Rue du domicile' })
  street: string;

  @ApiProperty({ example: 'Dakar', description: 'Ville de résidence' })
  city: string;

  @ApiProperty({ example: '11000', description: 'Code postal' })
  zipCode: string;

  @ApiProperty({ example: 'Sénégal', description: 'Pays' })
  country: string;
}