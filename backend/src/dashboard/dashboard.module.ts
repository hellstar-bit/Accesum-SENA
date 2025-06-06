// backend/src/dashboard/dashboard.module.ts - CORREGIDO
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AuthModule } from '../auth/auth.module'; // ⭐ IMPORTAR AuthModule
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
    AuthModule, // ⭐ AGREGAR AuthModule para que JwtAuthGuard funcione
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}