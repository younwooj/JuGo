import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

enum TransactionType {
  GIVE = 'GIVE',
  RECEIVE = 'RECEIVE',
}

enum Category {
  CASH = 'CASH',
  GIFT = 'GIFT',
  GOLD = 'GOLD',
}

export class CreateTransactionDto {
  @ApiProperty({ example: 'uuid', description: '연락처 ID' })
  @IsUUID()
  @IsNotEmpty()
  contactId: string;

  @ApiProperty({ example: 'uuid', description: '장부 그룹 ID' })
  @IsUUID()
  @IsNotEmpty()
  ledgerGroupId: string;

  @ApiProperty({ example: 'GIVE', enum: TransactionType, description: '거래 유형 (GIVE: 줌, RECEIVE: 받음)' })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @ApiProperty({ example: 'CASH', enum: Category, description: '카테고리 (CASH: 현금, GIFT: 선물, GOLD: 금)' })
  @IsEnum(Category)
  @IsNotEmpty()
  category: Category;

  @ApiProperty({ example: 100000, description: '금액 (환산 금액)' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: '정관장 홍삼', description: '선물명', required: false })
  @IsString()
  @IsOptional()
  originalName?: string;

  @ApiProperty({
    example: { purity: '24K', weight: 3.75, unit: '돈' },
    description: '금 정보 (JSON)',
    required: false,
  })
  @IsOptional()
  goldInfo?: any;

  @ApiProperty({ example: '결혼식 축의금', description: '메모', required: false })
  @IsString()
  @IsOptional()
  memo?: string;

  @ApiProperty({ example: '2026-01-10', description: '경조사 날짜', required: false })
  @IsDateString()
  @IsOptional()
  eventDate?: string;
}
