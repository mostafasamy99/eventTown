const logger = require('winston');

logger.configure({
  transports: [
    new logger.transports.File({
      filename: 'error.log',
      level: 'error',
    }),
    new logger.transports.File({
      filename: 'combined.log',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new logger.transports.Console({
      format: logger.format.simple(),
    })
  );
}

module.exports = logger;
