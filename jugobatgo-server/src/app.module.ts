import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { LedgerModule } from './ledger/ledger.module';
import { AiModule } from './ai/ai.module';
import { GoldModule } from './gold/gold.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ContactsModule,
    LedgerModule,
    AiModule,
    GoldModule,
    StatisticsModule,
  ],
})
export class AppModule {}
