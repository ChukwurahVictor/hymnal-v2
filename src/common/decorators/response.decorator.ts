import { SetMetadata } from '@nestjs/common';

export const API_RESPONSE_META = 'response_message';

export interface ResponseOptions {
  statusCode?: number;
  message?: string;
}

export const ResponseMessage = (options: ResponseOptions) =>
  SetMetadata(API_RESPONSE_META, options);
