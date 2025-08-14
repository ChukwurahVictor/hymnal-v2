import { Global, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { HymnModule } from './hymn/hymn.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaService } from './common/prisma/prisma.service';
import { JwtStrategy } from './auth/strategy/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './app.config';
import { CacheModule } from './common/cache/cache.module';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from './user/user.module';
import { ChorusModule } from './chorus/chorus.module';
import { VerseModule } from './verse/verse.module';
import { AuditLogModule } from './audit-log/audit-log.module';

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
  ],
  providers: [PrismaService, JwtService, JwtStrategy],
  exports: [AuthModule, JwtService],
})
export class AppModule {}
