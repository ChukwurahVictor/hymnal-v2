import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export interface Response<T> {
  data: T;
}

export interface ResponseOptions {
  statusCode?: number;
  message?: string;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector = new Reflector()) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    const responseOptions = this.reflector.getAllAndOverride<ResponseOptions>(
      'response_message',
      [context.getHandler(), context.getClass()],
    );

    // const message = responseOptions?.message;
    if (responseOptions?.statusCode) {
      context.switchToHttp().getResponse().status(responseOptions?.statusCode);
    }

    return next.handle().pipe(
      map((data) => ({
        statusCode: responseOptions?.statusCode || 200,
        message: responseOptions?.message,
        data,
      })),
    );

    // return next.handle().pipe(
    //   map((data) => {
    //     const response = context.switchToHttp().getResponse();
    //     const statusCode = response.statusCode || response.status || 200;

    //     return {
    //       statusCode,
    //       message: responseOptions?.message,
    //       result: data,
    //     };
    //   }),
    // );
  }
}
