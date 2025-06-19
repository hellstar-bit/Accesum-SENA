// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config();

console.log('🔍 Debug - Variables de entorno:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_SCHEMA:', process.env.DB_SCHEMA);

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  schema: process.env.DB_SCHEMA || 'acceso',
  synchronize: true, // ⭐ ACTIVADO: Para crear tablas automáticamente
  logging: process.env.NODE_ENV === 'development',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  autoLoadEntities: true,
  ssl: false,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
};

console.log('🔧 Configuración de BD:', {
  type: databaseConfig.type,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  schema: databaseConfig.schema,
  ssl: databaseConfig.ssl,
  synchronize: databaseConfig.synchronize,
});