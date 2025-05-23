// src/access/access.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessRecord } from './entities/access-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccessRecord])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class AccessModule {}