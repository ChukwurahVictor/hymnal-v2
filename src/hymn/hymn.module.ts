import { Module } from '@nestjs/common';
import { HymnService } from './hymn.service';
import { HymnController } from './hymn.controller';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { CacheModule } from 'src/common/cache/cache.module';
import { AuditLogModule } from 'src/audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, CacheModule, AuditLogModule],
  controllers: [HymnController],
  providers: [HymnService],
})
export class HymnModule {}
