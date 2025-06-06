// Agregar AttendanceModule al app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { AccessModule } from './access/access.module';
import { ConfigModule as ConfigurationModule } from './config/config.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ImportModule } from './import/import.module';
import { LearnerModule } from './learner/learner.module';
import { AttendanceModule } from './attendance/attendance.module'; // ⭐ NUEVA IMPORTACIÓN
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UsersModule,
    ProfilesModule,
    AccessModule,
    ConfigurationModule,
    DashboardModule,
    ImportModule,
    LearnerModule,
    AttendanceModule, // ⭐ NUEVA IMPORTACIÓN
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}