// backend/src/access/access.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessService } from './access.service';
import type { CreateAccessRecordDto } from './access.service';

@Controller('access')
@UseGuards(JwtAuthGuard)
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post('check-in')
  async checkIn(@Body() dto: CreateAccessRecordDto) {
    return this.accessService.createAccessRecord({ ...dto, type: 'entry' });
  }

  @Post('check-out')
  async checkOut(@Body() dto: CreateAccessRecordDto) {
    return this.accessService.createAccessRecord({ ...dto, type: 'exit' });
  }

  @Get('current')
  async getCurrentOccupancy() {
    return this.accessService.getCurrentOccupancy();
  }

  @Get('history')
  async getHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('date') date?: string,
    @Query('userId') userId?: string,
  ) {
    return this.accessService.getAccessHistory(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      date ? new Date(date) : undefined,
      userId ? parseInt(userId) : undefined,
    );
  }

  @Get('stats')
  async getStats(@Query('date') date?: string) {
    return this.accessService.getAccessStats(
      date ? new Date(date) : new Date(),
    );
  }

  @Get('search/:document')
  async searchByDocument(@Param('document') documentNumber: string) {
    const profile = await this.accessService.searchByDocument(documentNumber);
    if (!profile) {
      return { found: false };
    }
    return {
      found: true,
      profile: {
        id: profile.id,
        fullName: `${profile.firstName} ${profile.lastName}`,
        documentNumber: profile.documentNumber,
        type: profile.type.name,
        profileImage: profile.profileImage,
      },
    };
  }
}