import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (logger: winston.Logger) => {
  return (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error('Error occurred', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // PostgreSQL errors
    if (err.name === 'error' && (err as any).code) {
      switch ((err as any).code) {
        case '23505': // unique_violation
          error = { ...error, message: 'Duplicate entry', statusCode: 409 };
          break;
        case '23503': // foreign_key_violation
          error = { ...error, message: 'Foreign key constraint violation', statusCode: 400 };
          break;
        case '23502': // not_null_violation
          error = { ...error, message: 'Required field missing', statusCode: 400 };
          break;
        default:
          error = { ...error, message: 'Database error', statusCode: 500 };
      }
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  };
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error: CustomError = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};