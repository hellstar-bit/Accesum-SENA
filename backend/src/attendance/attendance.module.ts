
//⭐ PASO 3: Actualizar AttendanceModule para importar TimezoneModule
// backend/src/attendance/attendance.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { ClassScheduleController } from './class-schedule.controller';
import { InstructorAssignmentController } from './instructor-assignment.controller';
import { InstructorProfileController } from './instructor-profile.controller';

// Entities
import { AttendanceRecord } from './entities/attendance-record.entity';
import { ClassSchedule } from './entities/class-schedule.entity';
import { InstructorAssignment } from './entities/instructor-assignment.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';

// ⭐ IMPORTAR TimezoneModule
import { TimezoneModule } from '../config/timezone.module';
import { ProfilesModule } from '../profiles/profiles.module'; 
import { TrimesterScheduleController } from './TrimesterScheduleController';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceRecord,
      ClassSchedule,
      InstructorAssignment,
      Profile,
      User
    ]),
    TimezoneModule,
    ProfilesModule, // ⭐ AGREGAR AQUÍ
  ],
  controllers: [
    AttendanceController,
    ClassScheduleController,
    InstructorAssignmentController,
    InstructorProfileController,
    TrimesterScheduleController,
  ],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}