import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Address } from '../entities/address.entity';
import { Profile } from '../entities/profile.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { MedicalRecord } from '../entities/medical-record.entity';
import { Appointment } from '../entities/appointment.entity'; 
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Profile) private profileRepository: Repository<Profile>,
    @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>, 
  ) {}

  async getUserProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['profile', 'roles', 'profile.address', 'address', 'medicalRecord'],
    });  

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async updateUserProfile(userId: number, updateData: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['profile', 'profile.address', 'medicalRecord', 'roles'],
    });
  
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
  
    // Mise à jour du profil
    if (!user.profile) {
      user.profile = new Profile();
    }
  
    if (updateData.firstName !== undefined) user.profile.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) user.profile.lastName = updateData.lastName;
    if (updateData.gender !== undefined) user.profile.gender = updateData.gender;
    if (updateData.birthDate !== undefined) user.profile.birthDate = updateData.birthDate;
  
    // Téléphone & Email
    if (updateData.phoneNumber !== undefined) user.phoneNumber = updateData.phoneNumber;
  
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({ where: { email: updateData.email } });
      if (existingUser && existingUser.userId !== userId) {
        throw new BadRequestException('Cet email est déjà utilisé par un autre compte');
      }
      user.email = updateData.email;
    }
  
    // Adresse
    if (updateData.address) {
      const addr = user.address || new Address();
      if (updateData.address.street !== undefined) addr.street = updateData.address.street;
      if (updateData.address.city !== undefined) addr.city = updateData.address.city;
      if (updateData.address.zipCode !== undefined) addr.zipCode = updateData.address.zipCode;
      if (updateData.address.country !== undefined) addr.country = updateData.address.country;
      user.address = addr;
    }
  
    // Medical Record
    if (updateData.medicalRecord) {
      const medRecord = user.medicalRecord || new MedicalRecord();
      if (updateData.medicalRecord.bloodType !== undefined) medRecord.bloodType = updateData.medicalRecord.bloodType;
      if (updateData.medicalRecord.allergies !== undefined) medRecord.allergies = updateData.medicalRecord.allergies;
      if (updateData.medicalRecord.chronicDiseases !== undefined) medRecord.chronicDiseases = updateData.medicalRecord.chronicDiseases;
      if (updateData.medicalRecord.treatments !== undefined) medRecord.treatments = updateData.medicalRecord.treatments;
      user.medicalRecord = medRecord;
    }

    const isMedecin = user.roles?.some(role => role.roleName === 'MEDECIN');
    if (isMedecin) {
      if (updateData.specialty !== undefined) user.profile.specialty = updateData.specialty;
      if (updateData.experienceYears !== undefined) user.profile.experienceYears = updateData.experienceYears;
      if (updateData.biography !== undefined) user.profile.biography = updateData.biography;
      if (updateData.clinicName !== undefined) user.profile.clinicName = updateData.clinicName;
      if (updateData.consultationModes !== undefined) user.profile.consultationModes = updateData.consultationModes;
    }
  
    await this.profileRepository.save(user.profile);
    await this.userRepository.save(user);
  
    return this.getUserProfile(userId);
  }

  async updateProfilePicture(userId: number, filename: string) {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['profile'],
    });

    if (!user) {
      const filepath = join(process.cwd(), 'uploads/profile-pictures', filename);
      fs.unlinkSync(filepath);
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.profile?.profilePicture) {
      const oldFilepath = join(process.cwd(), 'uploads/profile-pictures', user.profile.profilePicture);
      if (fs.existsSync(oldFilepath)) {
        fs.unlinkSync(oldFilepath);
      }
    }

    if (!user.profile) {
      user.profile = new Profile();
    }

    user.profile.profilePicture = filename; 
    await this.profileRepository.save(user.profile);

    return {
      message: 'Photo de profil mise à jour',
      profilePicture: `/uploads/profile-pictures/${filename}`, // Retourner le chemin relatif
    };
  }

  async findByAccountNumber(accountNumber: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { accountNumber },
      relations: ['profile', 'roles', 'address', 'medicalRecord','availabilities'],
    });
  }

  async assignPatientToMedecin(patientAccountNumber: string, medecinAccountNumber: string) {
    const patient = await this.userRepository.findOne({
      where: { accountNumber: patientAccountNumber },
    });

    const medecin = await this.userRepository.findOne({
      where: { accountNumber: medecinAccountNumber },
    });

    if (!patient || !medecin) {
      throw new NotFoundException('Patient ou médecin non trouvé');
    }

    patient.medecinReferent = medecin;
    await this.userRepository.save(patient);

    return {
      message: `Le patient ${patient.accountNumber} est maintenant suivi par le médecin ${medecin.accountNumber}`,
    };
  }

  async getPatientsForCurrentMedecin(medecinUserId: number) {
  return this.userRepository.find({
    where: { medecinReferent: { userId: medecinUserId } },
    relations: ['profile', 'address'],
  });
}


  async getAllMedecins(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['profile', 'roles', 'address'],
      join: {
        alias: 'user',
        leftJoinAndSelect: {
          roles: 'user.roles',
          profile: 'user.profile',
          address: 'user.address',
        },
      },
      where: {
        roles: {
          roleName: 'MEDECIN',
        },
        enabled: true, // ✅ Seuls les comptes activés
      },
    });
  }
  

  async updateUserProfileAsMedecin(medecinId: number, patientId: number, updateData: UpdateUserDto) {
    const patient = await this.userRepository.findOne({
      where: { userId: patientId },
      relations: ['medecinReferent', 'medicalRecord']
    });

    if (!patient) {
      throw new NotFoundException('Patient non trouvé');
    }

    const isReferent = patient.medecinReferent?.userId === medecinId;
    const hasAppointment = await this.checkIfMedecinHasAppointmentWithPatient(medecinId, patientId);
    
    if (!isReferent && !hasAppointment) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier ce dossier');
    }
    

    // Mise à jour du dossier médical uniquement
    if (updateData.medicalRecord) {
      const medRecord = patient.medicalRecord || new MedicalRecord();
      Object.assign(medRecord, updateData.medicalRecord);
      patient.medicalRecord = medRecord;
    }

    return this.userRepository.save(patient);
  }
  
  async getAllPatients(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['profile', 'roles', 'address'],
      join: {
        alias: 'user',
        leftJoinAndSelect: {
          roles: 'user.roles',
          profile: 'user.profile',
          address: 'user.address',
        },
      },
      where: {
        roles: {
          roleName: 'PATIENT'
        }
      }
    });
  }

  async getPatientsWithAppointments(medecinId: number): Promise<User[]> {
    const appointments = await this.appointmentRepo.find({
      where: { doctor: { userId: medecinId } },
      relations: ['patient', 'patient.profile', 'patient.address'],
    });

    // Create map of unique patients using userId as key
    const uniquePatients = new Map<number, User>();
    for (const appointment of appointments) {
      const patient = appointment.patient;
      if (patient && !uniquePatients.has(patient.userId)) {
        uniquePatients.set(patient.userId, patient);
      }
    }

    return Array.from(uniquePatients.values());
  }

  async checkIfMedecinHasAppointmentWithPatient(medecinId: number, patientId: number): Promise<boolean> {
    const count = await this.appointmentRepo.count({
      where: {
        doctor: { userId: medecinId },
        patient: { userId: patientId },
        status: 'CONFIRMED',
      },
    });
  
    return count > 0;
  }
  
  async getBasicUserProfileById(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { userId: userId },
      select: ['userId', 'email'],
      relations: ['profile', 'roles'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return {
      userId: user.userId,
      email: user.email,
      profile: {
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        specialty: user.profile?.specialty,
        gender: user.profile?.gender,
        birthDate: user.profile?.birthDate,
        address: user.profile?.address,
        experienceYears: user.profile?.experienceYears,
        biography: user.profile?.biography,
        clinicName: user.profile?.clinicName,
        consultationModes: user.profile?.consultationModes,
        profilePicture: user.profile?.profilePicture,
        // add other Profile fields as needed
      },
      roles: user.roles?.map(role => ({ roleName: role.roleName })),
    };
  }
}