import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
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