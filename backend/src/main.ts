// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ⭐ CORS simplificado para debug
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

  // ⭐ Agregar prefijo global para que coincida con tu frontend
  app.setGlobalPrefix('api');

  // ⭐ Middleware de debug
  app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin}`);
    next();
  });

  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Backend running on port: ${port}`);
  console.log(`🌐 CORS enabled for: https://accesum-sena.netlify.app`);
  console.log(`📚 API available at: /api/*`);
}

bootstrap();