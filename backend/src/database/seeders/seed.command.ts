// src/database/seeders/seed.command.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { seedInitialData } from './initial-data.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('🌱 Iniciando seeder...');
    await seedInitialData(dataSource);
    console.log('✅ Seeder completado exitosamente');
  } catch (error) {
    console.error('❌ Error en el seeder:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();