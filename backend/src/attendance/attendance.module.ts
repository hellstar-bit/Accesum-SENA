// backend/src/attendance/attendance.module.ts - COMPLETO
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ⭐ SERVICIOS
import { AttendanceService } from './attendance.service';

// ⭐ CONTROLADORES
import { AttendanceController } from './attendance.controller';
import { InstructorProfileController } from './instructor-profile.controller';
import { InstructorAssignmentController } from './instructor-assignment.controller';
import { TrimesterScheduleController } from './TrimesterScheduleController';
import { ClassScheduleController } from './class-schedule.controller';
import { AttendanceNotificationsController } from './attendance-notifications.controller';

// ⭐ ENTIDADES
import { ClassSchedule } from './entities/class-schedule.entity';
import { TrimesterSchedule } from './entities/trimester-schedule.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { InstructorAssignment } from './entities/instructor-assignment.entity';

// ⭐ MÓDULOS RELACIONADOS
import { ProfilesModule } from '../profiles/profiles.module';
import { UsersModule } from '../users/users.module';
import { ConfigModule } from '../config/config.module';

// ⭐ SERVICIOS ADICIONALES
import { AttendanceNotificationsService } from './attendance-notifications.service';

@Module({
  imports: [
    // ⭐ IMPORTAR ENTIDADES PARA TYPEORM
    TypeOrmModule.forFeature([
      ClassSchedule,
      TrimesterSchedule,
      AttendanceRecord,
      InstructorAssignment,
    ]),
    
    // ⭐ MÓDULOS EXTERNOS NECESARIOS
    ProfilesModule, // Para InstructorProfileController
    UsersModule,    // Para relaciones con usuarios
    ConfigModule,   // Para competencias y fichas
  ],
  
  // ⭐ CONTROLADORES DEL MÓDULO
  controllers: [
    AttendanceController,
    InstructorProfileController,
    InstructorAssignmentController,
    TrimesterScheduleController,
    ClassScheduleController,
    AttendanceNotificationsController,
  ],
  
  // ⭐ SERVICIOS DEL MÓDULO
  providers: [
    AttendanceService,
    AttendanceNotificationsService,
  ],
  
  // ⭐ EXPORTAR SERVICIOS PARA OTROS MÓDULOS
  exports: [
    AttendanceService,
    AttendanceNotificationsService,
  ],
})
export class AttendanceModule {}
