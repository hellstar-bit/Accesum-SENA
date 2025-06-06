// backend/src/access/access.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessRecord } from './entities/access-record.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { AccessService } from './access.service';
import { AccessController } from './access.controller';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessRecord, Profile]),
    forwardRef(() => AttendanceModule), // ⭐ NUEVA IMPORTACIÓN
  ],
  controllers: [AccessController],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}