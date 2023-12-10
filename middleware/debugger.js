const winston = require('winston');

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log' }),
    new winston.transports.Console(),
  ],
});

const ErrorLogger = (error, origin = 'unknown') => {
  logger.error({
    message: error.message,
    stack: error.stack,
    origin,
  });
};

module.exports = ErrorLogger;
