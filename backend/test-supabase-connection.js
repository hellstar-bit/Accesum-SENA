// test-supabase-connection.js
// Coloca este archivo en la raíz de tu carpeta backend para probar la conexión

const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('🔄 Probando conexión a Supabase...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conexión exitosa a Supabase!');
    
    // Probar una consulta simple
    const result = await client.query('SELECT version()');
    console.log('📊 Versión de PostgreSQL:', result.rows[0].version);
    
    // Listar tablas existentes
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📋 Tablas existentes:', tables.rows.length);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();