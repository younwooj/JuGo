import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateLedgerGroupDto {
  @ApiProperty({ example: 'uuid', description: '사용자 ID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: '회사 동료', description: '장부 그룹 이름' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
