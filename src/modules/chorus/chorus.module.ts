import { Module } from '@nestjs/common';
import { ChorusService } from './chorus.service';
import { ChorusController } from './chorus.controller';

@Module({
  controllers: [ChorusController],
  providers: [ChorusService],
})
export class ChorusModule {}
