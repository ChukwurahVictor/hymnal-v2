export const QUEUE = 'messaging:';

export enum JOBS {
  QUEUE_EMAIL = 'queueEmail',
  QUEUE_WELCOME_EMAIL = 'queueWelcomeEmail',
  QUEUE_RESET_TOKEN_EMAIL = 'queueResetTokenEmail',
  SEND_EMAIL = 'sendEmail',
  QUEUE_CREATE_USER_EMAIL = 'queueCreateUserEmail',
}
