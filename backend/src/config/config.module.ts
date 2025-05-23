// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Regional } from './entities/regional.entity';
import { Center } from './entities/center.entity';
import { Coordination } from './entities/coordination.entity';
import { Program } from './entities/program.entity';
import { Ficha } from './entities/ficha.entity';
import { PersonnelType } from './entities/personnel-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Regional,
      Center,
      Coordination,
      Program,
      Ficha,
      PersonnelType,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class ConfigModule {}