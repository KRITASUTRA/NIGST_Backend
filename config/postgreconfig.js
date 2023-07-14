const { Client } = require('pg');

const connect = async () => 
{
  const password = 'dalN9dbG7u0uS6MPMDqAJj5pjUX8Yqaq'
  const connectionString = process.env.DATABASE_URL || `postgres://kspl:${password}@dpg-cfebmcmn6mpu0uc7ngtg-a.singapore-postgres.render.com/ignst?ssl=true`;
  
  try 
    {
      const client = new Client
      (
        {
          connectionString,
        }
      );
      await client.connect();
      return client;

    } 
  catch (error) 
    {
      throw error;
    }
};
module.exports = { connect };
