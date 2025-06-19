// backend/src/config/datasource.config.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { config } from 'dotenv';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  schema: process.env.DB_SCHEMA || 'acceso',
  entities: [
    join(__dirname, '..', '**', '*.entity{.ts,.js}')
  ],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: false, // ⭐ DESACTIVADO: Sin SSL
};

export const AppDataSource = new DataSource(dataSourceOptions);