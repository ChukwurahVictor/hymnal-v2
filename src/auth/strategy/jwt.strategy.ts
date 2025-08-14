import { CacheService } from 'src/common/cache/cache.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CacheKeysEnums } from 'src/common/cache/cache.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const [, , sessionId] = token.split('.');

    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const redisKey = `${CacheKeysEnums.TOKENS}:${user.id}:${sessionId}`;
    const session = await this.cacheService.get(redisKey);

    if (!session) throw new UnauthorizedException('Invalid or expired session');

    return user;
  }
}
