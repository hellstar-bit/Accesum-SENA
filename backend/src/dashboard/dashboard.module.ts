// backend/src/dashboard/dashboard.module.ts - VERSIÓN MEJORADA
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AuthModule } from '../auth/auth.module';

// Entidades necesarias
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { AccessRecord } from '../access/entities/access-record.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';
import { Regional } from '../config/entities/regional.entity';
import { Center } from '../config/entities/center.entity';
import { Coordination } from '../config/entities/coordination.entity';
import { Program } from '../config/entities/program.entity';
import { Ficha } from '../config/entities/ficha.entity';
import { Role } from 'src/users/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      AccessRecord,
      PersonnelType,
      Regional,
      Center,
      Coordination,
      Program,
      Ficha,
      Role
    ]),
    AuthModule, // Para que JwtAuthGuard funcione
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService], // Exportar el servicio para uso en otros módulos
})
export class DashboardModule {}