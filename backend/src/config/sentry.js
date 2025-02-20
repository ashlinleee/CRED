import * as Sentry from '@sentry/node';
import logger from '../utils/logger.js';

export const initSentry = () => {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    try {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express(),
          new Sentry.Integrations.Mongo(),
        ],
        tracesSampleRate: 1.0,
        beforeSend(event) {
          // Sanitize sensitive data
          if (event.request?.data) {
            delete event.request.data.password;
            delete event.request.data.cardNumber;
            delete event.request.data.cvv;
          }
          return event;
        },
        beforeBreadcrumb(breadcrumb) {
          // Don't track navigation to sensitive routes
          if (breadcrumb.category === 'navigation') {
            const sensitiveRoutes = ['/auth', '/cards', '/profile'];
            if (sensitiveRoutes.some(route => breadcrumb.message?.includes(route))) {
              return null;
            }
          }
          return breadcrumb;
        }
      });
      logger.info('Sentry initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Sentry:', error);
    }
  } else {
    logger.info('Sentry initialization skipped (not production or no DSN)');
  }
};

export const captureException = (error, context = {}) => {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.withScope(scope => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  }
  // Always log the error locally
  logger.error(error.message, { ...context, stack: error.stack });
};
