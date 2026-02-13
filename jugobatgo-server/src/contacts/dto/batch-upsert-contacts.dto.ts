import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchUpsertContactItemDto {
  @ApiProperty({ example: '김철수', description: '연락처 이름' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '010-1234-5678', description: '전화번호' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class BatchUpsertContactsDto {
  @ApiProperty({ example: 'uuid', description: '사용자 ID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    type: [BatchUpsertContactItemDto],
    description: '동기화할 연락처 목록',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchUpsertContactItemDto)
  contacts: BatchUpsertContactItemDto[];
}
