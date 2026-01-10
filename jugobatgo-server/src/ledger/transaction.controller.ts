import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({ summary: '거래 내역 생성' })
  @ApiResponse({ status: 201, description: '거래 내역이 생성되었습니다.' })
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: '장부 그룹의 모든 거래 내역 조회' })
  @ApiQuery({ name: 'ledgerGroupId', required: true, description: '장부 그룹 ID' })
  @ApiResponse({ status: 200, description: '거래 내역 목록을 반환합니다.' })
  findAll(@Query('ledgerGroupId') ledgerGroupId: string) {
    return this.transactionService.findAll(ledgerGroupId);
  }

  @Get('contact/:contactId')
  @ApiOperation({ summary: '연락처의 모든 거래 내역 조회' })
  @ApiResponse({ status: 200, description: '거래 내역 목록을 반환합니다.' })
  findByContact(@Param('contactId') contactId: string) {
    return this.transactionService.findByContact(contactId);
  }

  @Get('summary/:ledgerGroupId')
  @ApiOperation({ summary: '장부 그룹의 거래 요약 조회 (주받 온도 계산)' })
  @ApiResponse({ status: 200, description: '거래 요약 정보를 반환합니다.' })
  getSummary(@Param('ledgerGroupId') ledgerGroupId: string) {
    return this.transactionService.getSummary(ledgerGroupId);
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 거래 내역 조회' })
  @ApiResponse({ status: 200, description: '거래 내역 정보를 반환합니다.' })
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '거래 내역 수정' })
  @ApiResponse({ status: 200, description: '거래 내역이 수정되었습니다.' })
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '거래 내역 삭제' })
  @ApiResponse({ status: 200, description: '거래 내역이 삭제되었습니다.' })
  remove(@Param('id') id: string) {
    return this.transactionService.remove(id);
  }
}
