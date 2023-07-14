// Every device connected to the internet is assigned a unique IP address
// which serves as a unique identifier for that device on the internet.
// The IP address can be used to track the device's location and activity
// on the internet.
// There are two types of IP addresses: IPv4 and IPv6.

// In the context of web development, the IP address of a visitor to a website
// can be obtained using the req.ip property in Express.js.

const express = require('express');
const pool = require("../config/pool");
const rateLimit = require('express-rate-limit');
const Fingerprint2 = require('fingerprintjs2');


const crypto = require('crypto');

// Generates unique ID based on the visitor's IP address and user agent string using SHA-256 hash function

exports.generateVisitorId = function(ip, userAgent) {
  const hash = crypto.createHash('sha256');
  hash.update(ip + userAgent);
  return hash.digest('hex');
};
// Rate limiter middleware
exports.limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
});


exports.visitorCounter = async (req, res) => {
  let client;

  try {
    // Get a client from the connection pool
    client = await pool.connect();

    // Get the IP address of the visitor
    const ip = req.ip;

    // Get the user agent string
    const userAgent = req.headers['user-agent'];

    // Generate the unique ID number of the visitor using the IP address and user agent string
    const id = exports.generateVisitorId(ip, userAgent);

    // Check if the visitor's IP address and ID number are already in the PostgreSQL database
    const { rows } = await client.query('SELECT COUNT(*) FROM visitors WHERE ip = $1 AND id = $2', [ip, id]);
    const exists = rows[0].count > 0;

    if (!exists) {
      // Generate the browser fingerprint
      const components = await Fingerprint2.getPromise();
      const values = components.map(component => component.value);
      const fingerprint = Fingerprint2.x64hash128(values.join(''), 31);

      // Insert the visitor's IP address, ID number, user agent string, and fingerprint into the PostgreSQL database
      await client.query('INSERT INTO visitors (ip, id, user_agent, fingerprint) VALUES ($1, $2, $3, $4)', [ip, id, userAgent, fingerprint]);
    }

    // Get the total number of visitors from PostgreSQL
    const { rows: totalRows } = await client.query('SELECT COUNT(*) FROM visitors');
    const totalVisitors = totalRows[0].count;

    // Get the total number of unique visitors from PostgreSQL
    const { rows: uniqueRows } = await client.query('SELECT COUNT(DISTINCT fingerprint) FROM visitors');
    const uniqueVisitors = uniqueRows[0].count;

    // Send the visitor count as a response
    res.json({ total: totalVisitors, unique: uniqueVisitors });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while processing your request.');
  } finally {
    // Release the client back to the connection pool
    if (client) {
     await client.release();
    }
  }
};
