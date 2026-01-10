import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'uuid', description: '사용자 ID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: '김철수', description: '연락처 이름' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '010-1234-5678', description: '전화번호' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: 'uuid', description: '장부 그룹 ID', required: false })
  @IsUUID()
  @IsOptional()
  ledgerGroupId?: string;
}
