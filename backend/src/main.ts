// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
<<<<<<< HEAD
  
  // Configuración de CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['accesum-sena.vercel.app'] // Reemplaza con tu dominio
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  });

  // Global prefix para todas las rutas del API
  app.setGlobalPrefix('api');
  
  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
=======

  // Configurar CORS
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:4173',
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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

  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
>>>>>>> parent of 958358d (despliegue a vercel)

  const port = process.env.PORT || 3001;
  await app.listen(port);
<<<<<<< HEAD
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}

// Para Vercel
let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  if (process.env.NODE_ENV === 'production') {
    if (!cachedApp) {
      const app = await NestFactory.create(AppModule);

      app.enableCors({
        origin: true,
        credentials: true,
      });

      app.setGlobalPrefix('api');
      app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }));

      await app.init();
      cachedApp = app.getHttpAdapter().getInstance();
    }

    return cachedApp(req, res);
  } else {
    // Para desarrollo local
    bootstrap();
  }
}
=======

  console.log(`🚀 Aplicación corriendo en: http://localhost:${port}`);
  console.log(`📚 Documentación disponible en: http://localhost:${port}/api`);
}

bootstrap();
>>>>>>> parent of 958358d (despliegue a vercel)
