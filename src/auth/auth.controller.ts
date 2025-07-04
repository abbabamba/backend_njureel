import {
  Controller,
  Post,
  Put,
  Body,
  Param,
  Get,
  Res,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { ApiTags, ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CreatePatientDto } from './dto/create-patient.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth') // Groupe Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Inscription utilisateur' })
  @ApiBody({ type: RegisterUserDto })
  async register(@Body() userData: RegisterUserDto) {
    return this.authService.register(userData);
  }

  @Get('activate/:id')
  @ApiOperation({ summary: 'Activation du compte utilisateur' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du compte à activer' })
  async activate(@Param('id') id: number, @Res() res: Response) {
    const responseHtml = await this.authService.activateAccount(id);
    res.setHeader('Content-Type', 'text/html');
    res.send(responseHtml);
  }

  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'test@email.com' },
        password: { type: 'string', example: 'motdepasse123' },
      },
      required: ['email', 'password'],
    },
  })
  async login(@Body() loginData: { email: string; password: string }) {
    return this.authService.login(loginData);
  }

  @Post('resend-activation')
  @ApiOperation({ summary: 'Renvoyer le code ou lien d\'activation' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'test@email.com' },
        phoneNumber: { type: 'string', example: '+221771234567' },
        role: { type: 'string', enum: ['PATIENT', 'MEDECIN'], example: 'PATIENT' },
      },
      required: ['email', 'role'],
    },
  })
  async resendActivation(
    @Body() data: { email: string; phoneNumber?: string; role: string },
  ) {
    try {
      const result = await this.authService.resendActivation(data);
      return { success: true, message: result.message };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur lors de l\'envoi du code d\'activation',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Demander un lien de réinitialisation du mot de passe' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'test@email.com' },
      },
      required: ['email'],
    },
  })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  

  @Post('reset-password')
  @ApiOperation({ summary: 'Réinitialiser le mot de passe avec token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'test@email.com' },
        token: { type: 'string', example: '1234567890abcdef' },
        newPassword: { type: 'string', example: 'nouveaumotdepasse123' },
      },
      required: ['email', 'token', 'newPassword'],
    },
  })
  async resetPassword(
    @Body() body: { email: string; token: string; newPassword: string },
  ) {
    return this.authService.resetPassword(body.email, body.token, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
@Put('update-password')
async updatePassword(@Request() req, @Body() body: { oldPassword: string; newPassword: string }) {
  return this.authService.updatePassword(req.user.userId, body.oldPassword, body.newPassword);
}


  // ✅ Route sécurisée pour les médecins
  @UseGuards(JwtAuthGuard)
  @Post('medecin/create-patient')
  @ApiOperation({ summary: 'Permet à un médecin de créer un patient' })
  async createPatient(@Request() req, @Body() patientData: CreatePatientDto) {
    return this.authService.createPatientByMedecin(req.user.userId, patientData);
  }
}
