import { Global, Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { CategoryModule } from './modules/category/category.module';
import { HymnModule } from './modules/hymn/hymn.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaService } from './common/prisma/prisma.service';
import { JwtStrategy } from './modules/auth/strategy/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './app.config';
import { CacheModule } from './common/cache/cache.module';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from './modules/user/user.module';
import { ChorusModule } from './modules/chorus/chorus.module';
import { VerseModule } from './modules/verse/verse.module';
import { AuditLogModule } from './common/audit-log/audit-log.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Global()
@Module({
  imports: [
    AuthModule,
    CacheModule,
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: {
          expiresIn: config.get('jwt.expiresIn'),
        },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    HymnModule,
    CategoryModule,
    UserModule,
    ChorusModule,
    VerseModule,
    AuditLogModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
  ],
  providers: [
    PrismaService,
    JwtService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [AuthModule, JwtService],
})
export class AppModule {}
