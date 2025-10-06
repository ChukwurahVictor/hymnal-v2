import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ISendEmail, IWelcomeEmail, Template } from './interfaces';

@Injectable()
export class MailingService {
  constructor(private mailerService: MailerService) {}

  async sendTestEmail(email: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'This is just a test email from SecretSanta',
      template: 'testEmail',
      context: { email },
    });

    return { message: 'Test email successfully sent' };
  }

  async sendResetToken(email, firstName, token: any) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Requested',
      template: Template.passwordResetEmail,
      context: { email: email, firstName: firstName, link: token },
    });
    console.log('Password reset email sent successfully');
  }

  async sendWelcomeEmail({
    email,
    subject = 'Welcome Onboard to Hymnal',
    template = Template.welcomeUserEmail,
    firstName,
  }: IWelcomeEmail) {
    await this.mailerService.sendMail({
      to: email,
      subject,
      template,
      context: { email, firstName },
    });
  }

  async sendCreateUserEmail({
    email,
    subject = 'Welcome Onboard to Hymnal',
    template = Template.createUserEmail,
    firstName,
    password,
  }: ISendEmail) {
    await this.mailerService.sendMail({
      to: email,
      subject,
      template,
      context: { email, firstName, password },
    });
  }
}
