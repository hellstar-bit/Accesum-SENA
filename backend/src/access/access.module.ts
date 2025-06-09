// backend/src/access/access.module.ts - CORREGIDO
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { AccessRecord } from './entities/access-record.entity';
import { User } from '../users/entities/user.entity'; // ⭐ IMPORTAR User
import { Profile } from '../profiles/entities/profile.entity';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccessRecord, 
      User,        // ⭐ AGREGAR User AQUÍ
      Profile
    ]),
    AttendanceModule // ⭐ MANTENER AttendanceModule
  ],
  controllers: [AccessController],
  providers: [AccessService],
  exports: [AccessService]
})
export class AccessModule {}
