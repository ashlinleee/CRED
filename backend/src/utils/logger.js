const logger = {
  info: (...args) => {
    console.log(new Date().toISOString(), 'INFO:', ...args);
  },
  error: (...args) => {
    console.error(new Date().toISOString(), 'ERROR:', ...args);
  },
  warn: (...args) => {
    console.warn(new Date().toISOString(), 'WARN:', ...args);
  },
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(new Date().toISOString(), 'DEBUG:', ...args);
    }
  }
};

export const logRequest = (req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    ip: req.ip
  });
  next();
};

export const logError = (err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    ip: req.ip
  });
  next(err);
};

export default logger;
