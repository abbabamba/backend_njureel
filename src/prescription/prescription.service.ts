// src/prescription/prescription.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Prescription } from '../entities/prescription.entity';
import { Repository, DeepPartial } from 'typeorm';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { User } from '../entities/user.entity';
import { Appointment } from '../entities/appointment.entity';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async create(dto: CreatePrescriptionDto, doctorId: number): Promise<Prescription> {
    const patient = await this.userRepo.findOneBy({ userId: dto.patientId });
    const doctor = await this.userRepo.findOneBy({ userId: doctorId });
    
    if (!patient || !doctor) {
      throw new NotFoundException('Médecin ou patient introuvable');
    }

    let appointment: Appointment | null = null;
    if (dto.appointmentId) {
      appointment = await this.appointmentRepo.findOneBy({ appointmentId: dto.appointmentId });
      if (!appointment) {
        throw new NotFoundException('Rendez-vous introuvable');
      }
    }

    const prescriptionData: DeepPartial<Prescription> = {
      title: dto.title,
      content: dto.content,
      doctor: doctor,
      patient: patient,
      appointment: appointment || undefined,
      doctorAccountNumber: doctor.accountNumber || undefined
    };

    const prescription = this.prescriptionRepo.create(prescriptionData);
    return this.prescriptionRepo.save(prescription);
  }

  async findByPatient(patientId: number) {
    return this.prescriptionRepo.find({
      where: { patient: { userId: patientId } },
      relations: ['doctor', 'doctor.profile', 'appointment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByAppointment(appointmentId: number) {
    return this.prescriptionRepo.find({
      where: { appointment: { appointmentId } },
      relations: ['doctor', 'patient'],
    });
  }
}
