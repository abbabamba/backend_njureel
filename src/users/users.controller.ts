import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Param,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Récupérer le profil de l’utilisateur connecté' })
  async getProfile(@Request() req) {
    return this.usersService.getUserProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  @ApiOperation({ summary: 'Mettre à jour le profil de l’utilisateur connecté' })
  @ApiBody({ type: UpdateUserDto })
  async updateProfile(@Request() req, @Body() updateData: UpdateUserDto) {
    return this.usersService.updateUserProfile(req.user.userId, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-profile-picture')
  @ApiOperation({ summary: 'Uploader une photo de profil (JPG, PNG, max 5MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/profile-pictures',
      filename: (req, file, cb) => {
        if (!fs.existsSync('./uploads/profile-pictures')) {
          fs.mkdirSync('./uploads/profile-pictures', { recursive: true });
        }
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
    }
  }))
  async uploadProfilePicture(
    @Request() req,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.usersService.updateProfilePicture(req.user.userId, file.filename);
  }

  @Get('account/:accountNumber')
  @ApiOperation({ summary: 'Récupérer un utilisateur par son numéro de compte' })
  @ApiParam({ name: 'accountNumber', type: String })
  async findByAccountNumber(@Param('accountNumber') accountNumber: string) {
    const user = await this.usersService.findByAccountNumber(accountNumber);
    if (!user) {
      throw new NotFoundException(`Aucun utilisateur trouvé avec le numéro ${accountNumber}`);
    }
    return user;
  }

  @Get('patients/account/:accountNumber')
  @ApiOperation({ summary: 'Récupérer un patient par son numéro de compte' })
  @ApiParam({ name: 'accountNumber', type: String })
  async findPatientByAccountNumber(@Param('accountNumber') accountNumber: string) {
    const user = await this.usersService.findByAccountNumber(accountNumber);
    const isPatient = user?.roles?.some(role => role.roleName === 'PATIENT');
    if (!user || !isPatient) {
      throw new NotFoundException('Aucun patient trouvé');
    }
    return user;
  }

  @Get('medecins/account/:accountNumber')
  @ApiOperation({ summary: 'Récupérer un médecin par son numéro de compte' })
  @ApiParam({ name: 'accountNumber', type: String })
  async findMedecinByAccountNumber(@Param('accountNumber') accountNumber: string) {
    const user = await this.usersService.findByAccountNumber(accountNumber);
    const isMedecin = user?.roles?.some(role => role.roleName === 'MEDECIN');
    if (!user || !isMedecin) {
      throw new NotFoundException('Aucun médecin trouvé');
    }
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('assign-patient')
  @ApiOperation({ summary: 'Assigner un patient à un médecin' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        patientAccountNumber: { type: 'string' },
        medecinAccountNumber: { type: 'string' },
      },
      required: ['patientAccountNumber', 'medecinAccountNumber'],
    }
  })
  async assignPatientToMedecin(@Body() body: { patientAccountNumber: string; medecinAccountNumber: string }) {
    return this.usersService.assignPatientToMedecin(body.patientAccountNumber, body.medecinAccountNumber);
  }

 @UseGuards(JwtAuthGuard)
@Get('medecin/mes-patients')
@ApiOperation({ summary: 'Lister les patients du médecin connecté' })
async getMyPatients(@Request() req) {
  return this.usersService.getPatientsForCurrentMedecin(req.user.userId);
}


  @UseGuards(JwtAuthGuard)
  @Get(':accountNumber/availabilities')
  @ApiOperation({ summary: "Lister les disponibilités d'un médecin" })
  @ApiParam({ name: 'accountNumber', type: String })
  async getAvailabilities(@Param('accountNumber') accountNumber: string) {
    const user = await this.usersService.findByAccountNumber(accountNumber);
    if (!user || !user.roles.some(role => role.roleName === 'MEDECIN')) {
      throw new NotFoundException('Médecin non trouvé');
    }
    return user.availabilities;
  }

  @UseGuards(JwtAuthGuard)
  @Get('medecins')
  @ApiOperation({ summary: 'Lister tous les médecins' })
  async listMedecins() {
    return this.usersService.getAllMedecins();
  }

  @UseGuards(JwtAuthGuard)
  @Get('id/:userId')
  @ApiOperation({ summary: 'Récupérer un médecin par son userId' })
  @ApiParam({ name: 'userId', type: Number })
  async findMedecinByUserId(@Param('userId') userId: number) {
    const user = await this.usersService.getUserProfile(userId);
    const isMedecin = user?.roles?.some(role => role.roleName === 'MEDECIN');
    if (!user || !isMedecin) {
      throw new NotFoundException('Médecin non trouvé');
    }
    return user;
  }

  @UseGuards(JwtAuthGuard)
@Put(':userId/medical-record')
@ApiOperation({ summary: 'Mettre à jour le dossier médical d\'un patient (médecin uniquement)' })
@ApiParam({ name: 'userId', type: Number, description: 'ID du patient' })
@ApiBody({ type: UpdateUserDto })
async updateMedicalRecordForPatient(
  @Request() req,
  @Param('userId') userId: number,
  @Body() updateData: UpdateUserDto
) {
  console.log(`--- Tentative de mise à jour du dossier médical du patient ${userId} par l'utilisateur ${req.user.userId}`);

  const isMedecin = req.user.roles?.some(role => role.roleName === 'MEDECIN');
  console.log('Utilisateur est médecin ?', isMedecin);

  if (!isMedecin) {
    console.log('Accès refusé : utilisateur non médecin');
    throw new ForbiddenException('Seuls les médecins peuvent modifier le dossier médical');
  }

  const patient = await this.usersService.getUserProfile(userId);
  if (!patient) {
    console.log('Patient non trouvé');
    throw new NotFoundException('Patient non trouvé');
  }

  console.log(`Patient trouvé : ${patient.userId}, médecin référent : ${patient.medecinReferent?.userId}`);

  const isReferent = patient.medecinReferent?.userId === req.user.userId;
  console.log('Est médecin référent ?', isReferent);

  const hasAppointment = await this.usersService.checkIfMedecinHasAppointmentWithPatient(
    req.user.userId,
    patient.userId
  );
  console.log('A eu au moins un rendez-vous avec ce patient ?', hasAppointment);

  if (!isReferent && !hasAppointment) {
    console.log('Accès refusé : ni médecin référent ni rendez-vous avec le patient');
    throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier ce dossier');
  }

  console.log('Accès autorisé. Données reçues :', updateData);

  const sanitizedData = {
    medicalRecord: updateData.medicalRecord
  };

  return this.usersService.updateUserProfileAsMedecin(req.user.userId, userId, sanitizedData);
}

  
 
  @UseGuards(JwtAuthGuard)
  @Get('patients')
  @ApiOperation({ summary: 'Lister tous les patients' })
  async listPatients() {
    return this.usersService.getAllPatients();
  }

  @UseGuards(JwtAuthGuard)
  @Get('medecin/:medecinId/patients-from-appointments')
  @ApiOperation({ summary: 'Lister les patients ayant eu des rendez-vous avec ce médecin' })
  @ApiParam({ name: 'medecinId', type: Number })
  async getPatientsFromAppointments(@Param('medecinId') medecinId: number) {
    return this.usersService.getPatientsWithAppointments(medecinId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  @ApiOperation({ summary: 'Récupérer un utilisateur par son ID' })
  @ApiParam({ name: 'userId', type: Number })
  async getUserById(@Request() req, @Param('userId') userId: number) {
    const requestingUser = req.user;
  
    const user = await this.usersService.getUserProfile(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
  
    const isMedecin = requestingUser.roles?.some(role => role.roleName === 'MEDECIN');
  
    if (isMedecin) {
      // 1. autoriser si médecin référent
      if (user.medecinReferent?.userId === requestingUser.userId) {
        return user;
      }
  
      // 2. autoriser si au moins 1 rendez-vous validé ensemble
      const hasAppointment = await this.usersService.checkIfMedecinHasAppointmentWithPatient(
        requestingUser.userId,
        user.userId
      );
  
      if (!hasAppointment) {
        throw new ForbiddenException('Vous n\'êtes pas autorisé à consulter ce dossier');
      }
    }
  
    return user;
  }
  
  @UseGuards(JwtAuthGuard) // Protégé par JWT pour s'assurer que l'utilisateur est connecté
  @Get('basic-profile/:userId')
  @ApiOperation({ summary: 'Récupérer le profil de base (prénom, nom, rôle) d\'un utilisateur par son ID (pour affichage dans l\'UI)' })
  @ApiParam({ name: 'userId', type: Number })
  async getBasicProfile(@Param('userId') userId: number) {
    // Aucune vérification de rôle ou de rendez-vous ici, seulement l'authentification JWT
    return this.usersService.getBasicUserProfileById(userId);
  }

}
