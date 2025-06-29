import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

export const requestLogger = (logger: winston.Logger) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        contentLength: res.get('Content-Length'),
      };

      if (res.statusCode >= 400) {
        logger.warn('Request completed with error', logData);
      } else {
        logger.info('Request completed', logData);
      }
    });

    next();
  };
};