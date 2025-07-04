import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from '../entities/appointment.entity';
import { v4 as uuidv4 } from 'uuid';
import { TwilioService } from '../twilio/twilio.service';
import { NotificationService } from '../services/notification.service';
import { AudioCallService } from '../audio-call/audio-call.service';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly twilioService: TwilioService,
    private readonly notificationService: NotificationService,
    private readonly audioCallService: AudioCallService,
  ) {}

  async create(data: CreateAppointmentDto) {
    const patient = await this.userRepo.findOneBy({ userId: data.patientId });
    const doctor = await this.userRepo.findOneBy({ userId: data.doctorId });

    if (!patient || !doctor) {
      throw new NotFoundException('Patient or Doctor not found');
    }

    let meetingLink: string | undefined;

    if (data.type === 'VIDEO') {
        meetingLink = this.generateJitsiLink();
    }

    const { doctorId, patientId, appointmentDate, duration } = data;

    const startDate = new Date(appointmentDate);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + duration);

    const doctorConflicts = await this.appointmentRepo.find({
      where: {
        doctor: { userId: doctorId },
        appointmentDate: MoreThanOrEqual(startDate),
        endDate: LessThanOrEqual(endDate),
      },
    });

    if (doctorConflicts.length > 0) {
      throw new BadRequestException('Le médecin est déjà occupé à ce moment-là');
    }

    const patientConflicts = await this.appointmentRepo.find({
      where: {
        patient: { userId: patientId },
        appointmentDate: MoreThanOrEqual(startDate),
        endDate: LessThanOrEqual(endDate),
      },
    });

    if (patientConflicts.length > 0) {
      throw new BadRequestException('Le patient a déjà un rendez-vous à ce moment-là');
    }

    const appointment = this.appointmentRepo.create({
      appointmentDate: new Date(data.appointmentDate),
      duration: data.duration,
      type: data.type,
      reason: data.reason,
      visioLink: meetingLink,
      patient,
      doctor,
      status: 'PENDING',
      endDate: endDate.toISOString(),
    });

    return this.appointmentRepo.save(appointment);
  }

  // --- NOUVELLE MÉTHODE : findOneById ---
  async findOneById(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({
      where: { appointmentId: id },
      relations: {
        patient: { profile: true }, // Assurez-vous de charger les relations nécessaires
        doctor: { profile: true }
      }
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    return appointment;
  }
  // --- FIN NOUVELLE MÉTHODE ---

  private generateJitsiLink() {
    const uuid = uuidv4().replace(/-/g, '');
    const roomName = `NjureelConsult_${uuid.slice(0, 12)}`;
    return `https://meet.jit.si/${roomName}`;
  }

  async updateStatus(
    id: number,
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DONE',
    cancellationReason?: string,
  ) {
    const appointment = await this.appointmentRepo.findOne({
      where: { appointmentId: id },
      relations: {
        patient: { profile: true },
        doctor: { profile: true }
      }
    });

    if (!appointment) throw new NotFoundException('Appointment not found');

    if (status === 'CONFIRMED' && appointment.type === 'PHONE' && !appointment.visioLink) {
        try {
            const roomId = await this.audioCallService.createAudioRoom();
            appointment.visioLink = roomId;
            console.log(`Salle audio créée pour le RV ${id}: ${roomId}`);
        } catch (error) {
            console.error('Erreur lors de la création de la salle audio à la confirmation:', error);
            throw new BadRequestException('Impossible de créer la salle d\'appel audio pour ce rendez-vous lors de la confirmation.');
        }
    }

    appointment.status = status;
    
    if (status === 'CANCELLED' && cancellationReason) {
      appointment.cancellationReason = cancellationReason;
    }

    await this.appointmentRepo.save(appointment);
    await this.sendAppointmentNotification(appointment);

    return appointment;
  }

  async deleteAppointment(id: number, doctorId: number) {
  const appointment = await this.appointmentRepo.findOne({
    where: { appointmentId: id },
    relations: ['doctor'],
  });

  if (!appointment) {
    throw new NotFoundException('Rendez-vous non trouvé');
  }

  if (appointment.doctor.userId !== doctorId) {
    throw new BadRequestException('Vous ne pouvez supprimer que vos propres rendez-vous');
  }

  await this.appointmentRepo.remove(appointment);
  return { message: 'Rendez-vous supprimé avec succès' };
}


  async rate(id: number, from: 'patient' | 'doctor', rating: number) {
    const appointment = await this.appointmentRepo.findOneBy({
      appointmentId: id,
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    if (from === 'patient') appointment.patientRating = rating;
    else if (from === 'doctor') appointment.doctorRating = rating;

    return this.appointmentRepo.save(appointment);
  }

  async findByUser(userId: number) {
    return this.appointmentRepo.find({
      where: [
        { patient: { userId } },
        { doctor: { userId } }
      ],
      relations: {
        patient: {
          profile: true
        },
        doctor: {
          profile: true
        }
      },
      select: {
        appointmentId: true,
        appointmentDate: true,
        status: true,
        type: true,
        reason: true,
        cancellationReason: true, 
        duration: true,
        visioLink: true
      },
      order: {
        appointmentDate: 'DESC'
      }
    });
  }
  

  async generateWherebyLink(): Promise<string> {
    const apiKey = process.env.WHEREBY_API_KEY;

    const res = await fetch('https://api.whereby.dev/v1/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        roomNamePrefix: 'njureel',
        fields: ['hostRoomUrl', 'roomUrl'],
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Erreur API Whereby:', error);
      throw new Error('Impossible de créer la salle Whereby');
    }

    const data = await res.json();
    return data.roomUrl;
  }

  private async sendAppointmentNotification(appointment: Appointment) {
    const patient = appointment.patient;
    if (!patient) return;
  
    const email = patient.email;
    const phone = patient.phoneNumber;
    const firstName = patient.profile?.firstName || 'Cher patient';
    const appointmentDate = new Date(appointment.appointmentDate)
      .toLocaleString('fr-FR', { 
        dateStyle: 'long', 
        timeStyle: 'short' 
      });
  
    let statusMessage = '';
    let detailedMessage = '';
  
    switch (appointment.status) {
      case 'CONFIRMED':
        statusMessage = `Votre rendez-vous du ${appointmentDate} a été confirmé.`;
        detailedMessage = `<p>Bonjour ${firstName},</p><p>${statusMessage}</p>`;
        break;
      case 'CANCELLED':
        statusMessage = `Votre rendez-vous du ${appointmentDate} a été annulé.`;
        detailedMessage = `<p>Bonjour ${firstName},</p><p>${statusMessage}</p>`;
        
        if (appointment.cancellationReason) {
          detailedMessage += `<p><strong>Motif :</strong> ${appointment.cancellationReason}</p>`;
          statusMessage += ` Motif : ${appointment.cancellationReason}`;
        }
        break;
      default:
        return; 
    }
  
    if (email) {
      await this.notificationService.sendGenericEmail(
        email,
        "Mise à jour de votre rendez-vous",
        detailedMessage
      );
    }
  
    if (phone) {
      await this.notificationService.sendGenericSMS(
        phone,
        statusMessage
      );
    }
  }
}
