import logger from '../utils/logger.js';

// Store metrics in memory (consider using Redis for production)
const metrics = {
  requestCounts: {},
  responseTimes: {},
  errorCounts: {},
  slowRequests: []
};

const SLOW_REQUEST_THRESHOLD = 1000; // 1 second

export const performanceMiddleware = (req, res, next) => {
  const start = process.hrtime();
  const path = req.path;
  
  // Increment request count
  metrics.requestCounts[path] = (metrics.requestCounts[path] || 0) + 1;
  
  // Override end function to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const diff = process.hrtime(start);
    const time = diff[0] * 1000 + diff[1] / 1000000; // Convert to milliseconds
    
    // Store response time
    if (!metrics.responseTimes[path]) {
      metrics.responseTimes[path] = [];
    }
    metrics.responseTimes[path].push(time);
    
    // Keep only last 100 response times
    if (metrics.responseTimes[path].length > 100) {
      metrics.responseTimes[path].shift();
    }
    
    // Track slow requests
    if (time > SLOW_REQUEST_THRESHOLD) {
      metrics.slowRequests.push({
        path,
        method: req.method,
        time,
        timestamp: new Date(),
        query: req.query,
        body: req.body
      });
      
      // Keep only last 100 slow requests
      if (metrics.slowRequests.length > 100) {
        metrics.slowRequests.shift();
      }
      
      logger.warn(`Slow request detected: ${req.method} ${path} took ${time.toFixed(2)}ms`);
    }
    
    // Track errors
    if (res.statusCode >= 400) {
      metrics.errorCounts[path] = (metrics.errorCounts[path] || 0) + 1;
    }
    
    originalEnd.apply(res, args);
  };
  
  next();
};

export const getMetrics = () => {
  const result = {
    requestCounts: metrics.requestCounts,
    averageResponseTimes: {},
    errorRates: {},
    slowRequests: metrics.slowRequests
  };
  
  // Calculate average response times
  for (const [path, times] of Object.entries(metrics.responseTimes)) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    result.averageResponseTimes[path] = avg;
  }
  
  // Calculate error rates
  for (const [path, count] of Object.entries(metrics.errorCounts)) {
    const totalRequests = metrics.requestCounts[path] || 1;
    result.errorRates[path] = (count / totalRequests) * 100;
  }
  
  return result;
};

export const clearMetrics = () => {
  metrics.requestCounts = {};
  metrics.responseTimes = {};
  metrics.errorCounts = {};
  metrics.slowRequests = [];
};
