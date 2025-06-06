// backend/src/import/import.module.ts - COMPLETO
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Role } from '../users/entities/role.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';
import { Regional } from '../config/entities/regional.entity';
import { Center } from '../config/entities/center.entity';
import { Program } from '../config/entities/program.entity';
import { Ficha } from '../config/entities/ficha.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      Role,
      PersonnelType,
      Regional,
      Center,
      Program,
      Ficha,
    ])
  ],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}