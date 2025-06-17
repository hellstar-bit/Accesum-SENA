// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config();

console.log('🔍 Debug - Variables de entorno:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL existe:', !!process.env.DATABASE_URL);

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: true,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  autoLoadEntities: true,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
};

console.log('🔧 Configuración de BD:', {
  type: databaseConfig.type,
  hasUrl: !!databaseConfig.url,
  ssl: databaseConfig.ssl,
  synchronize: databaseConfig.synchronize,
});