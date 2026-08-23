const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pothole_db',
  password: 'Vandit@2006', 
  port: 5432,
})

pool.on('connect', () => {
  console.log('Connected to PostgreSQL')
})

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err)
})

module.exports = pool