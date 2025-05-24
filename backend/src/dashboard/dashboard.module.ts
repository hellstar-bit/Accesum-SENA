// backend/src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { AccessRecord } from '../access/entities/access-record.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      AccessRecord,
      PersonnelType,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}