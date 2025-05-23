const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: 'root',
      password: '',
      database: 'accesum'
    });
    
    console.log('✅ Conexión exitosa a MySQL');
    await connection.execute('SELECT 1');
    console.log('✅ Consulta de prueba exitosa');
    await connection.end();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('Código de error:', error.code);
  }
}

testConnection();