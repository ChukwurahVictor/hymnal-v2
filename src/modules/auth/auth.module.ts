import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { CacheModule } from 'src/common/cache/cache.module';
import { AuditLogModule } from 'src/common/audit-log/audit-log.module';
import { MessagingQueueConsumer } from 'src/common/messaging/queue/consumer';
import { MessagingQueueProducer } from 'src/common/messaging/queue/producer';
import { BullModule } from '@nestjs/bull';
import { QUEUE } from 'src/common/messaging/interfaces';
import { MailingModule } from 'src/common/messaging/mailing/mailing.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, MessagingQueueProducer, MessagingQueueConsumer],
  imports: [
    MailingModule,
    PrismaModule,
    CacheModule,
    AuditLogModule,
    BullModule.registerQueue({ name: QUEUE }),
    JwtModule.registerAsync({
      imports: [ConfigModule.forRoot()],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') },
      }),
    }),
  ],
})
export class AuthModule {}
