// src/prescription/prescription.controller.ts

import { Controller, Post, Body, Get, Param, Req, UseGuards } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Créer une ordonnance (médecin connecté)' })
  create(@Body() dto: CreatePrescriptionDto, @Req() req: any) {
    const doctorId = req.user.userId;
    return this.prescriptionService.create(dto, doctorId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/patient/:id')
  @ApiOperation({ summary: 'Lister les ordonnances d’un patient' })
  findByPatient(@Param('id') patientId: string) {
    return this.prescriptionService.findByPatient(+patientId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/appointment/:id')
  @ApiOperation({ summary: 'Lister les ordonnances associées à un rendez-vous' })
  findByAppointment(@Param('id') appointmentId: string) {
    return this.prescriptionService.findByAppointment(+appointmentId);
  }
}
