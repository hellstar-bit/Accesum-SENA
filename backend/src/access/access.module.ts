// backend/src/access/access.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessRecord } from './entities/access-record.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';

@Module({
  imports: [TypeOrmModule.forFeature([AccessRecord, Profile])],
  controllers: [AccessController],
  providers: [AccessService],
  exports: [TypeOrmModule, AccessService],
})
export class AccessModule {}