// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { simpleSeed } from './database/seeders/simple-seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS
  app.enableCors({
    origin: [
      'https://accesum-sena.netlify.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ⭐ EJECUTAR SEED AUTOMÁTICAMENTE
  try {
    const dataSource = app.get(DataSource);
    
    // Verificar si ya existe el admin antes de ejecutar seed
    const userRepository = dataSource.getRepository('User');
    const adminExists = await userRepository.findOne({
      where: { email: 'admin@sena.edu.co' }
    });

    if (!adminExists) {
      console.log('🌱 Ejecutando seed inicial automáticamente...');
      await simpleSeed(dataSource);
      console.log('✅ Seed completado - Sistema listo para usar');
      console.log('👤 Admin creado: admin@sena.edu.co / admin123');
    } else {
      console.log('ℹ️ Seed ya ejecutado - Admin existe');
      console.log('👤 Login admin: admin@sena.edu.co / admin123');
    }
  } catch (error) {
    console.log('⚠️ Error en seed automático:', error.message);
    console.log('💡 El sistema funcionará pero podrías necesitar crear datos manualmente');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Backend running on port: ${port}`);
  console.log(`🌐 API disponible en: https://accesum-sena.onrender.com/api`);
  console.log(`👤 Credenciales admin: admin@sena.edu.co / admin123`);
}

bootstrap();