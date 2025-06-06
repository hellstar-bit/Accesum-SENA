// backend/src/config/config.module.ts - CORREGIDO
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigController } from './config.controller';
import { Regional } from './entities/regional.entity';
import { Center } from './entities/center.entity';
import { Coordination } from './entities/coordination.entity';
import { Program } from './entities/program.entity';
import { Ficha } from './entities/ficha.entity';
import { PersonnelType } from './entities/personnel-type.entity';
import { Role } from '../users/entities/role.entity';
import { ConfigService } from './config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Regional,
      Center,
      Coordination,
      Program,
      Ficha,
      PersonnelType,
      Role,
    ])
  ],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}