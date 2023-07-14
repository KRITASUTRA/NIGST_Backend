const { Pool } = require('pg');

// const password = 'a1gsnYw3bF9PM44q4KIibnv4ploH1ijx'

// const pool = new Pool
// (
//   {
//     connectionString: process.env.DATABASE_URL|| `postgres://kspl:a1gsnYw3bF9PM44q4KIibnv4ploH1ijx@dpg-ch9p70pjvhtimra44j2g-a.singapore-postgres.render.com/nigst?ssl=true`
//   }
// );

const host = 'ec2-65-2-125-229.ap-south-1.compute.amazonaws.com'
const database = 'nigst'
const username = 'kspl'
const password = 'KSPL@PG123#'
const port = 5432; 
const pool = new Pool({
  host,
  database,
  user: username,
  password,
  port,
})
// const host = 'nigst-database.ct7tofa2ajsn.ap-south-1.rds.amazonaws.com'
// const database = 'nigst'
// const username = 'kspl'
// const password = 'KSPL123#'
// const port = 5432; 
// const pool = new Pool({
//   host,
//   database,
//   user: username,
//   password,
//   port,
// })

module.exports = pool;

