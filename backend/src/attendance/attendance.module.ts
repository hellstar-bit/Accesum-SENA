// attendance.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstructorAssignment } from './entities/instructor-assignment.entity';
import { ClassSchedule } from './entities/class-schedule.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { AccessRecord } from '../access/entities/access-record.entity';
import { AttendanceService } from './attendance.service';
import { InstructorAssignmentController } from './instructor-assignment.controller';
import { ClassScheduleController } from './class-schedule.controller';
import { AttendanceController } from './attendance.controller';
import { InstructorProfileController } from './instructor-profile.controller';
import { AccessModule } from '../access/access.module';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InstructorAssignment,
      ClassSchedule,
      AttendanceRecord,
      Profile,
      AccessRecord,
    ]),
    forwardRef(() => AccessModule),
    ProfilesModule,
  ],
  controllers: [
    InstructorAssignmentController,
    ClassScheduleController,
    AttendanceController,
    InstructorProfileController,
  ],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}

