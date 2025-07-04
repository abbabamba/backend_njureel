import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { NotificationService } from '../services/notification.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Profile } from '../entities/profile.entity';
import { Address } from '../entities/address.entity';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(Profile) private profileRepository: Repository<Profile>,
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    private readonly notificationService: NotificationService,
    private jwtService: JwtService,
  ) {}


  async register(userData: RegisterUserDto): Promise<User> {
    const { email, password, phoneNumber, firstName, lastName, gender, birthDate, role, address } = userData;

    if (!role) {
      throw new BadRequestException("Le rôle est obligatoire.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const roleEntity = await this.roleRepository.findOne({ where: { roleName: role } });

    if (!roleEntity) {
      throw new BadRequestException(`Le rôle ${role} n'existe pas.`);
    }

    // Création et sauvegarde de l'adresse
    const newAddress = this.addressRepository.create({
      street: address.street,
      city: address.city,
      zipCode: address.zipCode,
      country: address.country,
    });
    const savedAddress = await this.addressRepository.save(newAddress);

    // Création et sauvegarde du profil
    const newProfile = this.profileRepository.create({
      firstName,
      lastName,
      gender,
      birthDate,
      address: savedAddress,
    });
    const savedProfile = await this.profileRepository.save(newProfile);
    const accountNumber = await this.generateUniqueAccountNumber();

    // Création du compte utilisateur
    const newUser = this.userRepository.create({
      email: email || undefined,
      password: hashedPassword,
      phoneNumber: phoneNumber || undefined,
      enabled: false,
      accountNumber: accountNumber,
      roles: [roleEntity],
      profile: savedProfile,
      address: savedAddress,
    });

    if (role === 'MEDECIN' && !email) {
      throw new BadRequestException("L'email est obligatoire pour les médecins.");
    }

    if (role === 'PATIENT' && !phoneNumber) {
      throw new BadRequestException("Le numéro de téléphone est obligatoire pour les patients.");
    }

    try {
      const savedUser = await this.userRepository.save(newUser);
    
      
if (role === 'PATIENT') {
  const phoneNumber = savedUser.phoneNumber;
  if (phoneNumber) {
     
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      await this.notificationService.sendVerificationSMS(phoneNumber, verificationCode);
    
    savedUser.enabled = true;
    await this.userRepository.save(savedUser);
    console.log(`[INFO] Code de vérification envoyé à ${phoneNumber} : ${verificationCode}`);  } else {
    throw new BadRequestException("Le numéro de téléphone est manquant pour le patient.");
  }
}

 else {
        const email = savedUser.email;
        if (email) {
          const verificationLink = `http://192.168.8.3:3000/auth/activate/${savedUser.userId}`;
          await this.notificationService.sendVerificationEmail(email, verificationLink);
        } else {
          throw new BadRequestException("L'email est manquant pour le médecin.");
        }
      }
    
      return savedUser;
    } 
     catch (error) {
      throw new BadRequestException("Erreur lors de la création du compte.");
    }
  }

  

async activateAccount(userId: number): Promise<string> {
    const user = await this.userRepository.findOneBy({ userId });
    
    if (!user) {
        throw new NotFoundException(`Lien invalide ou expiré`);
    }

    if (user.enabled) {
        return `
            <html>
            <head>
                <meta http-equiv="refresh" content="2;url=http://192.168.8.3:3001/auth/login?activated=true" />
                <title>Compte déjà activé</title>
            </head>
            <body style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h2>Ce compte est déjà activé.</h2>
                <p>Vous allez être redirigé vers la page de connexion.</p>
            </body>
            </html>
        `;
    }

    user.enabled = true;
    await this.userRepository.save(user);

    return `
        <html>
        <head>
            <meta http-equiv="refresh" content="2;url=http://192.168.8.3:3001/auth/login?activated=true" />
            <title>Activation réussie</title>
        </head>
        <body style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h2>Votre compte a été activé avec succès !</h2>
            <p>Vous serez redirigé vers la page de connexion dans quelques instants...</p>
        </body>
        </html>
    `;
}


  async login(loginData: { email: string; password: string }) {
    console.log('Login attempt:', { email: loginData.email });

    const user = await this.userRepository.findOne({
        where: { email: loginData.email },
        relations: ['roles'], // 🔥 Charge les rôles
    });

    if (!user) {
        console.log('User not found');
        throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.enabled) {
        console.log('User not activated:', user.email);
        throw new UnauthorizedException('Veuillez activer votre compte avant de vous connecter.');
    }

    console.log('Found user:', { userId: user.userId, roles: user.roles.map(role => role.roleName) });

    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
        sub: user.userId, 
        email: user.email,
        roles: user.roles.map(role => role.roleName) 
    };

    return {
        access_token: this.jwtService.sign(payload),
        
        roles: payload.roles, // 🔥 Retourne les rôles
        userId: user.userId
    };
}

  async resendActivation(data: { email: string; phoneNumber?: string; role: string }) {
    const user = await this.userRepository.findOne({ 
      where: { email: data.email }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.enabled) {
      throw new BadRequestException('Ce compte est déjà activé');
    }

    try {
      if (data.role === 'PATIENT' && data.phoneNumber) {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        await this.notificationService.sendVerificationSMS(data.phoneNumber, verificationCode);
        return { 
          success: true, 
          message: 'Un nouveau code de vérification a été envoyé par SMS' 
        };
      } else {
        const verificationLink = `http://192.168.8.3:3000/auth/activate/${user.userId}`;
        await this.notificationService.sendVerificationEmail(data.email, verificationLink);
        return { 
          success: true, 
          message: 'Un nouveau lien d\'activation a été envoyé par email' 
        };
      }
    } catch (error) {
      throw new BadRequestException('Erreur lors de l\'envoi du code de vérification');
    }
  }

  // ✅ Demande de réinitialisation du mot de passe
  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
        console.log(`❌ Aucun compte trouvé pour l'email: ${email}`);
        throw new NotFoundException('Aucun compte trouvé avec cet email.');
    }

    // Générer un token sécurisé pour la réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // Expiration dans 1 heure
    await this.userRepository.save(user);

    console.log(`✅ Token généré: ${resetToken}`);
    console.log(`✅ Token hashé: ${resetTokenHash}`);
    console.log(`✅ Date expiration: ${user.resetPasswordExpires}`);

    // Envoyer le lien par email
    const resetLink = `http://192.168.8.3:3001/auth/reset-password?token=${resetToken}&email=${email}`;
    console.log(`✅ Lien de réinitialisation: ${resetLink}`);

    await this.notificationService.sendVerificationEmail(email, resetLink);

    return { message: 'Un email de réinitialisation a été envoyé.' };
}


  // ✅ Réinitialisation du mot de passe
  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      throw new UnauthorizedException('Lien de réinitialisation invalide ou expiré.');
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new UnauthorizedException('Le lien de réinitialisation a expiré.');
    }

    // Vérifier si le token fourni correspond au token stocké
    const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isTokenValid) {
      throw new UnauthorizedException('Token invalide.');
    }

    // Mettre à jour le mot de passe et supprimer le token de réinitialisation
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await this.userRepository.save(user);

    return { message: 'Mot de passe mis à jour avec succès.' };
  }

  // ✅ Mise à jour du mot de passe
  async updatePassword(userId: number, oldPassword: string, newPassword: string) {
  const user = await this.userRepository.findOne({ where: { userId } });

  if (!user) {
    throw new NotFoundException('Utilisateur non trouvé');
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new UnauthorizedException('Mot de passe actuel incorrect.');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await this.userRepository.save(user);

  return { message: 'Mot de passe mis à jour avec succès.' };
}


  generateRandomPassword(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@!$';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
  // ✅ Création d'un patient par un médecin

 async createPatientByMedecin(medecinId: number, data: CreatePatientDto): Promise<User> {
  const medecin = await this.userRepository.findOne({
    where: { userId: medecinId },
    relations: ['roles'],
  });

  if (!medecin || !medecin.roles.some(r => r.roleName === 'MEDECIN')) {
    throw new UnauthorizedException("Seuls les médecins peuvent ajouter des patients");
  }

  const role = await this.roleRepository.findOne({ where: { roleName: 'PATIENT' } });
  if (!role) {
    throw new BadRequestException("Le rôle PATIENT n'existe pas");
  }

  const address = await this.addressRepository.save(this.addressRepository.create(data.address));

  const profile = await this.profileRepository.save(this.profileRepository.create({
    firstName: data.firstName,
    lastName: data.lastName,
    gender: data.gender,
    birthDate: data.birthDate,
    address,
  }));

  const accountNumber = await this.generateUniqueAccountNumber();

  // ✅ Générer un mot de passe aléatoire
  const rawPassword = this.generateRandomPassword();
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const user = this.userRepository.create({
    phoneNumber: data.phoneNumber,
    email: data.email || undefined,
    password: hashedPassword,
    roles: [role],
    enabled: true,
    profile,
    address,
    accountNumber,
    medecinReferentId: medecinId,
  });

  const savedUser = await this.userRepository.save(user);

  // ✅ Envoi du mot de passe par SMS
  if (data.phoneNumber) {
    await this.notificationService.sendGenericSMS(
      data.phoneNumber,
      `Bienvenue sur Njureel ! Voici votre mot de passe temporaire : ${rawPassword}`
    );
  }

  // ✅ Envoi du mot de passe par email si email fourni
  if (data.email) {
    await this.notificationService.sendGenericEmail(
      data.email,
      'Votre compte Njureel a été créé',
      `<p>Bonjour ${data.firstName},</p>
      <p>Votre compte a été créé avec succès par votre médecin référent sur Njureel.</p>
      <p><strong>Mot de passe temporaire :</strong> ${rawPassword}</p>
      <p>Vous pouvez vous connecter et modifier ce mot de passe depuis votre espace personnel.</p>`
    );
  }

  return savedUser;
}




  private async generateUniqueAccountNumber(): Promise<string> {
    const prefix = 'ACCT';
    let accountNumber: string = '';
    let isUnique = false;

    while (!isUnique) {
      const random = Math.floor(100000 + Math.random() * 900000); // 6 chiffres
      accountNumber = `${prefix}-${random}`;

      const existingUser = await this.userRepository.findOne({
        where: { accountNumber }
      });

      if (!existingUser) {
        isUnique = true;
      }
    }

    return accountNumber;
  }
}
