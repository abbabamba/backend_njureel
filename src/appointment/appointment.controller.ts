import { Controller, Post, Body, Patch, Param, Get, Query,Delete, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RateDto } from './dto/rate.dto';
import { ApiTags, ApiBody, ApiParam, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un rendez-vous' })
  @ApiBody({ type: CreateAppointmentDto })
  create(@Body() body: CreateAppointmentDto) {
    return this.appointmentService.create(body);
  }

  // --- NOUVEL ENDPOINT : Récupérer un rendez-vous par ID ---
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un rendez-vous par son ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du rendez-vous' })
  async findOne(@Param('id') id: string) {
    return this.appointmentService.findOneById(+id); // Convertir l'ID en nombre
  }
  // --- FIN NOUVEL ENDPOINT ---

  @Patch(':id/status')
  @ApiOperation({ summary: "Mettre à jour le statut d'un rendez-vous" })
  @ApiParam({ name: 'id', type: Number, description: 'ID du rendez-vous' })
  @ApiBody({ type: UpdateStatusDto })
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    return this.appointmentService.updateStatus(+id, body.status, body.cancellationReason);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un rendez-vous (médecin connecté)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du rendez-vous à supprimer' })
  deleteAppointment(@Param('id') id: string, @Req() req: any) {
    const doctorId = req.user.userId;
    return this.appointmentService.deleteAppointment(+id, doctorId);
  }

  @Patch(':id/rate/:from')
  @ApiOperation({ summary: 'Noter une consultation par le patient ou le médecin' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du rendez-vous à noter' })
  @ApiParam({ name: 'from', enum: ['patient', 'doctor'], description: 'Qui effectue la notation' })
  @ApiBody({ type: RateDto })
  rate(
    @Param('id') id: string,
    @Param('from') from: 'patient' | 'doctor',
    @Body() body: RateDto,
  ) {
    return this.appointmentService.rate(+id, from, body.rating);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer les rendez-vous d’un utilisateur (patient ou médecin)' })
  @ApiQuery({ name: 'userId', required: true, type: Number, description: 'ID de l’utilisateur' })
  findByUser(@Query('userId') userId: number) {
    return this.appointmentService.findByUser(userId);
  }
}
