// backend/src/config/config.module.ts - CORREGIDO

import { ConfigController } from './config.controller';
import { Regional } from './entities/regional.entity';
import { Center } from './entities/center.entity';
import { Coordination } from './entities/coordination.entity';
import { Program } from './entities/program.entity';
import { PersonnelType } from './entities/personnel-type.entity';
import { Role } from '../users/entities/role.entity';
import { ConfigService } from './config.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FichaCompetenceController } from './ficha-competence.controller';
import { FichaCompetenceService } from './ficha-competence.service';
import { FichaCompetence } from './entities/ficha-competence.entity';
import { Ficha } from './entities/ficha.entity';
import { Competence } from './entities/competence.entity';
import { CompetenceController } from './competence.controller'; // ⭐ AGREGAR
import { CompetenceService } from './competence.service';
import { User } from '../users/entities/user.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Regional,
      FichaCompetence,
      Center,
      Coordination,
      Program,
      Competence,
      Ficha,
      PersonnelType,
      Role,
      User,
    ])
  ],
  controllers: [ConfigController,FichaCompetenceController,CompetenceController],
  providers: [ConfigService,FichaCompetenceService,CompetenceService],
  exports: [ConfigService,FichaCompetenceService,CompetenceService],
})
export class ConfigModule {}