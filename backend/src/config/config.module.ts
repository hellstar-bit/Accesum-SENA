// backend/src/config/config.module.ts
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Regional,
      Center,
      Coordination,
      Program,
      Ficha,
      PersonnelType,
      Role, // Agregar Role aquí
    ]),
  ],
  controllers: [ConfigController], // Agregar el controlador aquí
  providers: [],
  exports: [TypeOrmModule],
})
export class ConfigModule {}