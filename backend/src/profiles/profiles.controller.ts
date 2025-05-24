// backend/src/profiles/profiles.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfilesService } from './profiles.service';
import type { UpdateProfileDto } from './profiles.service';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.profilesService.findAll(+page, +limit, search);
  }

  @Get('stats')
  getStats() {
    return this.profilesService.getProfileStats();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.profilesService.findOne(id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.profilesService.findByUserId(userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(id, updateProfileDto);
  }

  @Post(':id/regenerate-qr')
  regenerateQR(@Param('id', ParseIntPipe) id: number) {
    return this.profilesService.regenerateQRCode(id);
  }

  @Post(':id/upload-image')
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @Body('image') imageBase64: string,
  ) {
    if (!imageBase64) {
      throw new BadRequestException('No se proporcionó imagen');
    }
    return this.profilesService.uploadProfileImage(id, imageBase64);
  }
}