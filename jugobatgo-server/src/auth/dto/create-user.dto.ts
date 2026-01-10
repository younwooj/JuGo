import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: '사용자 이메일' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'KAKAO', description: '소셜 로그인 제공자 (KAKAO, NAVER, GOOGLE)' })
  @IsString()
  @IsNotEmpty()
  socialProvider: string;
}
