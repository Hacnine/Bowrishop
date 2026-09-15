import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = (exceptionResponse as any)?.message || exception.message;
      details = (exceptionResponse as any)?.error;

      if (status >= 500) {
        this.logger.error(
          `[${request.method} ${request.url}] ${status} ${message}`,
          exception.stack,
        );
      } else {
        this.logger.warn(
          `[${request.method} ${request.url}] ${status} ${message}`,
        );
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `[${request.method} ${request.url}] 500 ${message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `[${request.method} ${request.url}] Unknown error`,
        JSON.stringify(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    });
  }
}
