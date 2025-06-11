import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Ficha } from '../config/entities/ficha.entity';
import { Competence } from '../config/entities/competence.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    User, 
    Role, 
    Profile, 
    Ficha,
    Competence
  ])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
