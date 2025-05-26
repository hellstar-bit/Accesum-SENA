// backend/src/learner/learner.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { LearnerController } from './learner.controller';
import { LearnerService } from './learner.service';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, User])],
  controllers: [LearnerController],
  providers: [LearnerService],
  exports: [LearnerService],
})
export class LearnerModule {}