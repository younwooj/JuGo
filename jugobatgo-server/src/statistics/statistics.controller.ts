import { Controller, Get, Param } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: '사용자 전체 통계 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '주밥 온도, 총 거래액, 거래 수 등 전체 통계',
  })
  async getUserStatistics(@Param('userId') userId: string) {
    return this.statisticsService.getUserStatistics(userId);
  }

  @Get('user/:userId/jubad-temperature')
  @ApiOperation({ summary: '주밥 온도 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '주밥 온도 (30~42도)' })
  async getJubadTemperature(@Param('userId') userId: string) {
    const temperature = await this.statisticsService.calculateJubadTemperature(userId);
    return { temperature };
  }

  @Get('user/:userId/category')
  @ApiOperation({ summary: '카테고리별 통계 (현금/선물/금)' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '카테고리별 준/받은 금액 및 거래 수',
  })
  async getCategoryStatistics(@Param('userId') userId: string) {
    return this.statisticsService.getCategoryStatistics(userId);
  }

  @Get('user/:userId/monthly')
  @ApiOperation({ summary: '월별 통계 (최근 12개월)' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '월별 준/받은 금액 및 잔액',
  })
  async getMonthlyStatistics(@Param('userId') userId: string) {
    return this.statisticsService.getMonthlyStatistics(userId);
  }

  @Get('user/:userId/top-contacts')
  @ApiOperation({ summary: '거래 많은 연락처 Top 10' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '총 거래액 기준 상위 10명 연락처',
  })
  async getTopContactStatistics(@Param('userId') userId: string) {
    return this.statisticsService.getTopContactStatistics(userId);
  }

  @Get('user/:userId/ledger-groups')
  @ApiOperation({ summary: '장부 그룹별 통계' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '장부 그룹별 준/받은 금액 및 잔액',
  })
  async getLedgerGroupStatistics(@Param('userId') userId: string) {
    return this.statisticsService.getLedgerGroupStatistics(userId);
  }
}
