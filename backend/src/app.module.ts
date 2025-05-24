// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { AccessModule } from './access/access.module';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { ImportModule } from './import/import.module';
import { DashboardModule } from './dashboard/dashboard.module'; // ⬅️ Agregar esta línea

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    UsersModule,
    ProfilesModule,
    AccessModule,
    ConfigModule,
    AuthModule,
    ImportModule,
    DashboardModule, // ⬅️ Agregar esta línea
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}