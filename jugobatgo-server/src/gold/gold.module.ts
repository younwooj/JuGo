import { Module } from '@nestjs/common';
import { GoldController } from './gold.controller';
import { GoldService } from './gold.service';
import { GoldScheduler } from './gold.scheduler';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GoldController],
  providers: [GoldService, GoldScheduler],
  exports: [GoldService],
})
export class GoldModule {}
