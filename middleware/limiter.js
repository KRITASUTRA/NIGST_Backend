const { default: rateLimit } = require("express-rate-limit");
const pool = require("../config/pool");

const IPlimiter = rateLimit({
  windowMs: 120000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many login attempts from this IP. Try again later.',
  keyGenerator: function (req, res) {
    return req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;
  },
  handler: async (req, res, next) => {
    try {

      const blockedUntil = new Date(Date.now() + 600000);
      await blockUser(req.ip, blockedUntil, "Maximum failed attempts reached.");
      return res.status(429).json({ error: "Too many requests. IP blocked." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
});

const LimitUpload = rateLimit({
  windowMs: 180000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many login attempts from this IP. Try again later.',
  keyGenerator: function (req, res) {
    return req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;
  },
 
});

const checkBlockedIP = async (req, res, next) => {
  try {
    const { ip } = req;
    const blockedUser = await pool.query(
      'SELECT * FROM blocked_users WHERE ip = $1 AND blocked_until > NOW()',
      [ip]
    );

    if (blockedUser.rows.length > 0) {
      const blockedUntil = blockedUser.rows[0].blocked_until;

      if (blockedUntil > new Date()) {
        return res.status(403).json({
          message: 'IP blocked. Try again later.',
          blockedUntil,
        });
      } else {
        await unblockIP(ip);
      }
    }

    next(); 
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

async function unblockIP(ip) {
  try {
    const query = 'DELETE FROM blocked_users WHERE ip = $1';
    await pool.query(query, [ip]);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function blockUser(ip, blockedUntil, reason) {
  try {
    const query = `
      INSERT INTO blocked_users (ip, blocked_until, reason)
      VALUES ($1, $2, $3)
    `;
    await pool.query(query, [ip, blockedUntil, reason]);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = { IPlimiter,checkBlockedIP,LimitUpload };
