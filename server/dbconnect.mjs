import mysql from 'mysql2/promise';

async function connect() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'chatweb',
    });
    console.log('MySQL connection established.');
    return connection;
  } catch (error) {
    console.error('Error connecting to MySQL:', error);
    throw error;
  }
}

export default connect;