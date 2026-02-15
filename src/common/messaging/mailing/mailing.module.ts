import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailingService } from './mailing.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('messaging.mail.host'),
          port: config.get<number>('messaging.mail.port'),
          secure: true,
          auth: {
            user: config.get('messaging.mail.user'),
            pass: config.get('messaging.mail.password'),
          },
          // pool: true,
        },
        defaults: {
          from: `"Hymnal" <${config.get('messaging.mail.user')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailingService],
  exports: [MailingService],
})
export class MailingModule {}
