// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Debug: mostrar qué variables se están leyendo
console.log('🔍 Debug - Variables de entorno:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT, 'parsed:', parseInt(process.env.DB_PORT || '3307', 10));
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD?.length || 0);

export const databaseConfig: TypeOrmModuleOptions = { // ⭐ TIPADO EXPLÍCITO
  type: 'mysql' as const, // ⭐ ASSERTION DE TIPO
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3307', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'accesum',
  synchronize: true, // ⭐ ACTIVAR para recrear todo
  dropSchema: false, // ⭐ ELIMINAR esquema existente
  logging: true,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  autoLoadEntities: true,
};

console.log('🔧 Configuración final de BD:', {
  host: databaseConfig.host,
  port: databaseConfig.port,
  username: databaseConfig.username,
  database: databaseConfig.database,
});
