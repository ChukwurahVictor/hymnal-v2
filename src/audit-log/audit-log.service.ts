import { PrismaService } from 'src/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}
  async log({
    action,
    entityType,
    entityId,
    userId,
    description,
  }: {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
    entityType:
      | 'USER'
      | 'HYMN'
      | 'CATEGORY'
      | 'VERSE'
      | 'CHORUS'
      | 'SOLFA_IMAGE';
    entityId?: string;
    userId: string;
    description: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        details: { description },
      },
    });
  }
}
