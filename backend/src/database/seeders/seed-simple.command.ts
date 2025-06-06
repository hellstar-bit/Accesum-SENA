// backend/src/database/seeders/seed-simple.command.ts - CORREGIDO
import { AppDataSource } from '../../config/datasource.config';
import { simpleSeed } from './simple-seed';

async function runSeed() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await AppDataSource.initialize();
    
    console.log('🌱 Ejecutando seed...');
    await simpleSeed(AppDataSource);
    
    console.log('🎉 Seed completado exitosamente!');
  } catch (error) {
    console.error('❌ Error ejecutando seed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

runSeed();