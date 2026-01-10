import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { GoldService } from './gold.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('gold')
@Controller('gold')
export class GoldController {
  constructor(private readonly goldService: GoldService) {}

  @Get('rate')
  @ApiOperation({ summary: '최신 금 시세 조회' })
  @ApiResponse({ status: 200, description: '최신 금 시세 정보' })
  async getLatestRate() {
    return this.goldService.getLatestRate();
  }

  @Post('rate/update')
  @ApiOperation({ summary: '금 시세 수동 업데이트' })
  @ApiResponse({ status: 200, description: '금 시세 업데이트 성공' })
  async updateRates() {
    return this.goldService.updateGoldRates();
  }

  @Get('convert/to-krw')
  @ApiOperation({ summary: '금(g) -> 원화 환산' })
  @ApiQuery({ name: 'weight', description: '금 무게(g)' })
  @ApiQuery({ name: 'karat', description: '금 순도', enum: ['24K', '18K', '14K'], required: false })
  async convertToKRW(
    @Query('weight') weight: string,
    @Query('karat') karat: '24K' | '18K' | '14K' = '24K',
  ) {
    const weightInGrams = parseFloat(weight);
    const amountInKRW = await this.goldService.convertGoldToKRW(weightInGrams, karat);
    return {
      weight: weightInGrams,
      karat,
      amountInKRW,
    };
  }

  @Get('convert/to-gold')
  @ApiOperation({ summary: '원화 -> 금(g) 환산' })
  @ApiQuery({ name: 'amount', description: '금액(원)' })
  @ApiQuery({ name: 'karat', description: '금 순도', enum: ['24K', '18K', '14K'], required: false })
  async convertToGold(
    @Query('amount') amount: string,
    @Query('karat') karat: '24K' | '18K' | '14K' = '24K',
  ) {
    const amountInKRW = parseInt(amount);
    const weightInGrams = await this.goldService.convertKRWToGold(amountInKRW, karat);
    return {
      amountInKRW,
      karat,
      weight: weightInGrams,
    };
  }

  @Get('history')
  @ApiOperation({ summary: '금 시세 히스토리 조회' })
  @ApiQuery({ name: 'days', description: '조회 일수', required: false })
  async getHistory(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days) : 30;
    return this.goldService.getGoldRateHistory(daysNum);
  }
}
