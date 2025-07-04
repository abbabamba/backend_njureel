import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { Consultation } from '../entities/consultation.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ConsultationService {
  constructor(
    @InjectRepository(Consultation)
    private consultationRepo: Repository<Consultation>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(User)
    private userRepo: Repository<User>
  ) {}

  // Méthode pour récupérer toutes les consultations
  async findAll() {
    return this.consultationRepo.find({
      relations: ['doctor', 'patient', 'appointment'], // Vous pouvez ajouter d'autres relations si nécessaire
    });
  }

  async create(appointmentId: number, data: Partial<Consultation>) {
    const appointment = await this.appointmentRepo.findOne({
      where: { appointmentId },
      relations: ['patient', 'doctor'],
    });

    if (!appointment) throw new NotFoundException('Appointment not found');

    const consultation = this.consultationRepo.create({
      ...data,
      appointment,
      patient: appointment.patient,
      doctor: appointment.doctor,
    });

    appointment.status = 'DONE';
    await this.appointmentRepo.save(appointment);

    return this.consultationRepo.save(consultation);
  }

  async findByAppointment(appointmentId: number) {
    return this.consultationRepo.findOne({
      where: { appointment: { appointmentId } },
    });
  }

  async getConsultationsForMedecin(accountNumber: string) {
    const doctor = await this.userRepo.findOne({
      where: { accountNumber },
    });

    if (!doctor) throw new NotFoundException('Médecin non trouvé');

    return this.consultationRepo.createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.doctor', 'doctor')
      .leftJoinAndSelect('consultation.patient', 'patient')
      .leftJoinAndSelect('consultation.appointment', 'appointment')
      .where('doctor.userId = :doctorId', { doctorId: doctor.userId })
      .orderBy('consultation.date', 'DESC')
      .getMany();
  }

  async getConsultationsForPatient(accountNumber: string) {
    const patient = await this.userRepo.findOne({
      where: { accountNumber },
    });

    if (!patient) throw new NotFoundException('Patient non trouvé');

    return this.consultationRepo.createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.doctor', 'doctor')
      .leftJoinAndSelect('consultation.patient', 'patient')
      .leftJoinAndSelect('consultation.appointment', 'appointment')
      .where('patient.userId = :patientId', { patientId: patient.userId })
      .orderBy('consultation.date', 'DESC')
      .getMany();
  }

}
