import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VitalSign } from './entities/vital-sign.entity';
import { User } from '../entities/user.entity';
import { Appointment } from '../entities/appointment.entity';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';

@Injectable()
export class VitalSignsService {
  constructor(
    @InjectRepository(VitalSign)
    private vitalSignsRepository: Repository<VitalSign>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async createForUser(userId: number, createVitalSignDto: CreateVitalSignDto) {
    const user = await this.userRepository.findOne({
      where: { userId }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const vitalSign = this.vitalSignsRepository.create({
      ...createVitalSignDto,
      user,
      recordedAt: createVitalSignDto.recordedAt || new Date()
    });

    return this.vitalSignsRepository.save(vitalSign);
  }

  async findAllByUser(userId: number) {
    return this.vitalSignsRepository.find({
      where: { user: { userId } },
      order: { recordedAt: 'DESC' }
    });
  }

  async findOneByUser(userId: number, id: number) {
    const vitalSign = await this.vitalSignsRepository.findOne({
      where: { id, user: { userId } }
    });

    if (!vitalSign) {
      throw new NotFoundException('Signe vital non trouvé');
    }

    return vitalSign;
  }

  async removeByUser(userId: number, id: number) {
    const vitalSign = await this.findOneByUser(userId, id);
    
    await this.vitalSignsRepository.remove(vitalSign);
    return { message: 'Signe vital supprimé avec succès' };
  }

  async findAllByPatientId(requester: User, patientId: number) {
    const isMedecin = requester.roles?.some(role => role.roleName === 'MEDECIN');
    if (!isMedecin) {
      throw new ForbiddenException("Accès réservé aux médecins");
    }
  
    const patient = await this.userRepository.findOne({ 
      where: { userId: patientId },
      relations: ['medecinReferent']
    });
    
    if (!patient) {
      throw new NotFoundException('Patient non trouvé');
    }
  
    // ✅ Vérifier si c’est le médecin référent OU s’il a eu un rendez-vous avec ce patient
    const isReferent = patient.medecinReferent?.userId === requester.userId;
  
    const hasAppointment = await this.vitalSignsRepository.manager.getRepository(Appointment).count({
      where: {
        doctor: { userId: requester.userId },
        patient: { userId: patientId },
        status: 'CONFIRMED' 
      }
    }) > 0;
  
    if (!isReferent && !hasAppointment) {
      throw new ForbiddenException("Vous n'avez pas de lien établi avec ce patient");
    }
  
    return this.vitalSignsRepository.find({
      where: { user: { userId: patientId } },
      order: { recordedAt: 'DESC' }
    });
  }
  
}
