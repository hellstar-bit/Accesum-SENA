// backend/src/learner/learner.module.ts - ACTUALIZADO CON ENTIDADES REALES
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearnerController } from './learner.controller';
import { LearnerService } from './learner.service';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';

// ⭐ IMPORTAR ENTIDADES REALES PARA MIS CLASES
import { TrimesterSchedule } from '../attendance/entities/trimester-schedule.entity';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile, 
      User,
      // ⭐ ENTIDADES REALES AGREGADAS
      TrimesterSchedule,
      AttendanceRecord
    ])
  ],
  controllers: [LearnerController],
  providers: [LearnerService],
  exports: [LearnerService],
})
export class LearnerModule {}