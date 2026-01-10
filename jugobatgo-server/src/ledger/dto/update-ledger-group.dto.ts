import { PartialType } from '@nestjs/swagger';
import { CreateLedgerGroupDto } from './create-ledger-group.dto';

export class UpdateLedgerGroupDto extends PartialType(CreateLedgerGroupDto) {}
