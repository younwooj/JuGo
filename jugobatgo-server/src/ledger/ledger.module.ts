import { Module } from '@nestjs/common';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
  controllers: [LedgerController, TransactionController],
  providers: [LedgerService, TransactionService],
  exports: [LedgerService, TransactionService],
})
export class LedgerModule {}
