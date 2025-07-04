import { Controller, Post, Get, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Experiences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('experiences')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateExperienceDto) {
    return this.experienceService.createExperience(req.user.userId, dto);
  }

  @Get('me')
  async getMyExperiences(@Request() req) {
    return this.experienceService.getExperiences(req.user.userId);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: number, @Body() dto: UpdateExperienceDto) {
    return this.experienceService.updateExperience(req.user.userId, id, dto);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: number) {
    return this.experienceService.deleteExperience(req.user.userId, id);
  }
}
