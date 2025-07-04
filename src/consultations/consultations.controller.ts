import { Controller, Post, Body, Param, Get, UseGuards, Request } from '@nestjs/common';
import { ConsultationService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { ApiTags, ApiBody, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';

@ApiTags('consultations') // Swagger group
@ApiBearerAuth()  // Authentification par JWT
@Controller('consultations')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post(':appointmentId')
  @ApiOperation({ summary: 'Créer une consultation pour un rendez-vous donné' })
  @ApiParam({ name: 'appointmentId', type: Number, description: 'ID du rendez-vous' })
  @ApiBody({ type: CreateConsultationDto })
  create(@Param('appointmentId') id: string, @Body() body: CreateConsultationDto) {
    return this.consultationService.create(+id, body);
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Récupérer une consultation par ID de rendez-vous' })
  @ApiParam({ name: 'appointmentId', type: Number, description: 'ID du rendez-vous' })
  getByAppointment(@Param('appointmentId') id: string) {
    return this.consultationService.findByAppointment(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('medecin/:accountNumber')
  @ApiOperation({ summary: 'Liste des consultations d’un médecin via son numéro de compte' })
  @ApiParam({ name: 'accountNumber', type: String, description: 'Numéro de compte du médecin' })
  async getConsultationsByMedecin(@Param('accountNumber') accountNumber: string) {
    return this.consultationService.getConsultationsForMedecin(accountNumber);
  }

  @UseGuards(JwtAuthGuard)
  @Get('patient/:accountNumber')
  @ApiOperation({ summary: 'Liste des consultations d’un patient via son numéro de compte' })
  @ApiParam({ name: 'accountNumber', type: String, description: 'Numéro de compte du patient' })
  async getConsultationsByPatient(@Param('accountNumber') accountNumber: string) {
    return this.consultationService.getConsultationsForPatient(accountNumber);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les consultations (accès admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard) // Protégez la route avec JwtAuthGuard et un guard de rôles
 // @Roles(Role.ADMIN) // Assurez-vous d'utiliser un décorateur pour limiter l'accès aux admins
  async getAllConsultations(@Request() req: Request) {
    return this.consultationService.findAll(); // Méthode à implémenter dans le service
  }
}
