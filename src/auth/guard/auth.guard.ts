import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class AdminAuthGuard extends AuthGuard('jwt') {
  constructor(private prisma: PrismaService) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = await super.canActivate(context);

    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user.userRole !== 'Admin') {
      throw new ForbiddenException(
        'User cannot access this resource. You are not an Admin',
      );
    }
    if (!user.status) {
      throw new UnauthorizedException('User is disabled');
    }

    return true;
  }
}
