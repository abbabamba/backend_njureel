import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { User } from '../entities/user.entity';
import { Availability } from '../entities/availability.entity';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepo: Repository<Availability>,
    @InjectRepository(User)
    private userRepo: Repository<User>
  ) {}

  async create(userId: number, dto: CreateAvailabilityDto) {
    const doctor = await this.userRepo.findOne({ where: { userId }, relations: ['roles'] });
    if (!doctor || !doctor.roles.some(role => role.roleName === 'MEDECIN')) {
      throw new NotFoundException('Médecin non trouvé');
    }

    const availability = this.availabilityRepo.create({
      ...dto,
      doctor
    });

    return this.availabilityRepo.save(availability);
  }

  async getAllByDoctor(userId: number) {
    const doctor = await this.userRepo.findOne({ where: { userId }, relations: ['roles'] });
    if (!doctor || !doctor.roles.some(role => role.roleName === 'MEDECIN')) {
      throw new NotFoundException('Médecin non trouvé');
    }

    return this.availabilityRepo.find({
      where: { doctor: { userId } },
      order: { startDate: 'ASC' }
    });
  }

  async update(id: number, dto: UpdateAvailabilityDto) {
    const availability = await this.availabilityRepo.findOne({ where: { id } });
    if (!availability) {
      throw new NotFoundException('Disponibilité non trouvée');
    }

    Object.assign(availability, dto);
    return this.availabilityRepo.save(availability);
  }

  async delete(id: number) {
    const availability = await this.availabilityRepo.findOne({ where: { id } });
    if (!availability) {
      throw new NotFoundException('Disponibilité non trouvée');
    }

    return this.availabilityRepo.remove(availability);
  }

  async getByAccountNumber(accountNumber: string) {
    const doctor = await this.userRepo.findOne({ where: { accountNumber }, relations: ['roles'] });
    if (!doctor || !doctor.roles.some(role => role.roleName === 'MEDECIN')) {
      throw new NotFoundException('Médecin non trouvé');
    }

    return this.availabilityRepo.find({
      where: { doctor: { userId: doctor.userId } },
      order: { startDate: 'ASC' }
    });
  }
  async getByDoctorId(userId: number) {
    const doctor = await this.userRepo.findOne({ where: { userId }, relations: ['roles'] });
    if (!doctor || !doctor.roles.some(role => role.roleName === 'MEDECIN')) {
      throw new NotFoundException('Médecin non trouvé');
    }
  
    return this.availabilityRepo.find({
      where: { doctor: { userId } },
      order: { startDate: 'ASC' },
    });
  }
  
}
