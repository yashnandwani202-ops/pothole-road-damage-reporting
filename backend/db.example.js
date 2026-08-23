const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pothole_db',
  password: 'YOUR_PASSWORD_HERE', // set your own local Postgres password here
  port: 5432,
})

pool.on('connect', () => {
  console.log('Connected to PostgreSQL')
})

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err)
})

module.exports = pool