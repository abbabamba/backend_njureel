import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException
} from '@nestjs/common';
import { VitalSignsService } from './vital-signs.service';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiResponse
} from '@nestjs/swagger';

@ApiTags('Signes Vitaux')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vital-signs')
export class VitalSignsController {
  constructor(private readonly vitalSignsService: VitalSignsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un enregistrement de signes vitaux pour l’utilisateur connecté' })
  @ApiBody({ type: CreateVitalSignDto })
  @ApiResponse({ status: 201, description: 'Signes vitaux créés avec succès' })
  create(@Request() req, @Body() createVitalSignDto: CreateVitalSignDto) {
    return this.vitalSignsService.createForUser(req.user.userId, createVitalSignDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les signes vitaux de l’utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Liste des signes vitaux récupérée avec succès' })
  findAll(@Request() req) {
    return this.vitalSignsService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un signe vital spécifique de l’utilisateur connecté' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du signe vital' })
  @ApiResponse({ status: 200, description: 'Signe vital trouvé' })
  @ApiResponse({ status: 404, description: 'Signe vital non trouvé' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.vitalSignsService.findOneByUser(req.user.userId, +id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('patient/:id')
  @ApiOperation({ summary: "Récupérer tous les signes vitaux d'un patient (réservé aux médecins)" })
  @ApiParam({ name: 'id', type: Number })
  findAllForPatient(@Request() req, @Param('id') id: string) {
    return this.vitalSignsService.findAllByPatientId(req.user, +id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un signe vital spécifique de l’utilisateur connecté' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du signe vital à supprimer' })
  @ApiResponse({ status: 200, description: 'Signe vital supprimé' })
  @ApiResponse({ status: 404, description: 'Signe vital non trouvé' })
  remove(@Request() req, @Param('id') id: string) {
    return this.vitalSignsService.removeByUser(req.user.userId, +id);
  }
}
