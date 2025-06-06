// backend/src/config/datasource.config.ts - CORREGIDO
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

// Configuración específica para DataSource (seeds, migrations, etc.)
export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql', // ✅ Especificar tipo explícitamente
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3307'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'accesum', // ✅ CORREGIDO: cambiado de 'accesum_sena' a 'accesum'
  entities: [
    join(__dirname, '..', '**', '*.entity{.ts,.js}')
  ],
  synchronize: process.env.NODE_ENV !== 'production', // ⚠️ Solo en desarrollo
  logging: process.env.NODE_ENV === 'development',
  charset: 'utf8mb4',
  timezone: 'Z',
};

// DataSource para usar en seeds y migrations
export const AppDataSource = new DataSource(dataSourceOptions);