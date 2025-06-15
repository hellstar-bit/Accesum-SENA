import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Servir archivos estáticos del frontend en producción
  if (process.env.NODE_ENV === 'production') {
    app.useStaticAssets(path.join(__dirname, '../../frontend/dist'));

    // Manejar rutas del frontend (SPA routing) - CON TIPOS CORRECTOS
    app.getHttpAdapter().get('*', (req: Request, res: Response) => {
      if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
      }
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap();
