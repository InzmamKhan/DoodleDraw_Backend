const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, 
  },
  max: 10,                 
  idleTimeoutMillis: 30000,   
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log(' Connected to Supabase PostgreSQL database successfully');
});

pool.on('error', (err) => {
  console.error(' Unexpected error on idle database client:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};