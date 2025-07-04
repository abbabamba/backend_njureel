import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experience } from '../entities/experience.entity';
import { Profile } from '../entities/profile.entity';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class ExperienceService {
  constructor(
    @InjectRepository(Experience) private experienceRepo: Repository<Experience>,
    @InjectRepository(Profile) private profileRepo: Repository<Profile>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async createExperience(userId: number, dto: CreateExperienceDto) {
    const user = await this.userRepo.findOne({ where: { userId }, relations: ['profile'] });
    if (!user || !user.profile) throw new NotFoundException('Profil non trouvé');

    const experience = this.experienceRepo.create({ ...dto, profile: user.profile });
    return this.experienceRepo.save(experience);
  }

  async getExperiences(userId: number) {
    const user = await this.userRepo.findOne({ where: { userId }, relations: ['profile', 'profile.experiences'] });
    if (!user || !user.profile) throw new NotFoundException('Profil non trouvé');
    return user.profile.experiences;
  }

  async updateExperience(userId: number, experienceId: number, dto: UpdateExperienceDto) {
    const user = await this.userRepo.findOne({ where: { userId }, relations: ['profile'] });
    if (!user || !user.profile) throw new NotFoundException('Profil non trouvé');

    const experience = await this.experienceRepo.findOne({ where: { id: experienceId }, relations: ['profile'] });
    if (!experience) throw new NotFoundException('Expérience non trouvée');
    if (experience.profile.profileId !== user.profile.profileId) throw new ForbiddenException('Non autorisé');

    Object.assign(experience, dto);
    return this.experienceRepo.save(experience);
  }

  async deleteExperience(userId: number, experienceId: number) {
    const user = await this.userRepo.findOne({ where: { userId }, relations: ['profile'] });
    if (!user || !user.profile) throw new NotFoundException('Profil non trouvé');

    const experience = await this.experienceRepo.findOne({ where: { id: experienceId }, relations: ['profile'] });
    if (!experience) throw new NotFoundException('Expérience non trouvée');
    if (experience.profile.profileId !== user.profile.profileId) throw new ForbiddenException('Non autorisé');

    return this.experienceRepo.remove(experience);
  }
}