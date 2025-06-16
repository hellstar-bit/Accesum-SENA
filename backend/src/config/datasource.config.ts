// backend/src/config/datasource.config.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

// Configuración específica para DataSource (seeds, migrations, etc.)
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres', // ✅ Cambiado a PostgreSQL
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'postgres',
  entities: [
    join(__dirname, '..', '**', '*.entity{.ts,.js}')
  ],
  synchronize: process.env.NODE_ENV !== 'production', // ⚠️ Solo en desarrollo
  logging: process.env.NODE_ENV === 'development',
  
  // Configuración SSL para Supabase
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Schema por defecto
  schema: 'public',
  
  // Configuraciones adicionales para PostgreSQL
  extra: {
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 2000,
  },
};

// DataSource para usar en seeds y migrations
export const AppDataSource = new DataSource(dataSourceOptions);