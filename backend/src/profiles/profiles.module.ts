// backend/src/profiles/profiles.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, User])],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [TypeOrmModule, ProfilesService],
})
export class ProfilesModule {}