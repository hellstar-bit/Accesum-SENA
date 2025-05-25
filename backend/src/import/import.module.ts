// backend/src/import/import.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Role } from '../users/entities/role.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';
import { Regional } from '../config/entities/regional.entity';
import { Center } from '../config/entities/center.entity';
import { Ficha } from '../config/entities/ficha.entity';
import { Program } from '../config/entities/program.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      Role,
      PersonnelType,
      Regional,
      Center,
      Ficha,        // ⭐ AGREGAR
      Program,      // ⭐ AGREGAR
    ]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  providers: [ImportService],
  controllers: [ImportController],
})
export class ImportModule {}