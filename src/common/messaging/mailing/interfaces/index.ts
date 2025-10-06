export enum Template {
  passwordResetEmail = 'passwordResetEmail',
  welcomeUserEmail = 'welcomeUserEmail',
  createUserEmail = 'createUserEmail',
}

export interface ISendEmail {
  email: string;
  firstName: string;
  template?: Template;
  subject?: string;
  password?: string;
}

export interface IResetPassword extends ISendEmail {
  link: string;
}

export interface IWelcomeEmail extends ISendEmail {
  email: string;
}

export interface ICreateEmail extends ISendEmail {
  referenceNo: string;
}
