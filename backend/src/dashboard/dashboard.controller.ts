// backend/src/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('recent-activity')
  async getRecentActivity(@Query('limit') limit?: string) {
    const activityLimit = limit ? parseInt(limit) : 10;
    return this.dashboardService.getRecentActivity(activityLimit);
  }

  @Get('user-growth')
  async getUserGrowth() {
    return this.dashboardService.getUserGrowth();
  }

  @Get('users-by-role')
  async getUsersByRole() {
    return this.dashboardService.getUsersByRole();
  }
}