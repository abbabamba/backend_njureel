import { Controller, Post, Get, Body, UseGuards, Request, Param, Delete, Patch } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('Disponibilités')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une disponibilité pour un médecin' })
  @ApiBody({ type: CreateAvailabilityDto })
  create(@Request() req, @Body() dto: CreateAvailabilityDto) {
    return this.availabilityService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les disponibilités du médecin connecté' })
  getAll(@Request() req) {
    return this.availabilityService.getAllByDoctor(req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une disponibilité' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateAvailabilityDto })
  update(@Param('id') id: number, @Body() dto: UpdateAvailabilityDto) {
    return this.availabilityService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une disponibilité' })
  @ApiParam({ name: 'id', type: Number })
  delete(@Param('id') id: number) {
    return this.availabilityService.delete(id);
  }

  @Get('doctor/:accountNumber')
  @ApiOperation({ summary: 'Récupérer les disponibilités d’un médecin par numéro de compte' })
  @ApiParam({ name: 'accountNumber', type: String })
  getByAccountNumber(@Param('accountNumber') accountNumber: string) {
    return this.availabilityService.getByAccountNumber(accountNumber);
  }

  @Get('by-doctor-id/:userId')
@ApiOperation({ summary: 'Récupérer les disponibilités d’un médecin par son userId' })
@ApiParam({ name: 'userId', type: Number })
getByDoctorId(@Param('userId') userId: number) {
  return this.availabilityService.getByDoctorId(userId);
}

}
