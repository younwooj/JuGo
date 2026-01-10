import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class GoldService {
  private readonly logger = new Logger(GoldService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 최신 금 시세 조회
   */
  async getLatestRate() {
    const latest = await this.prisma.goldRate.findFirst({
      orderBy: { date: 'desc' },
    });

    if (!latest) {
      // 데이터가 없으면 수동으로 업데이트 시도
      await this.updateGoldRates();
      return this.prisma.goldRate.findFirst({
        orderBy: { date: 'desc' },
      });
    }

    // 1시간 이상 지났으면 업데이트
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (latest.updatedAt < oneHourAgo) {
      await this.updateGoldRates();
      return this.prisma.goldRate.findFirst({
        orderBy: { date: 'desc' },
      });
    }

    return latest;
  }

  /**
   * 금 시세 업데이트 (외부 API 호출)
   * 실제 KRX API 또는 한국금거래소 API 연동이 필요합니다.
   * 현재는 예시 데이터를 사용합니다.
   */
  async updateGoldRates() {
    try {
      // TODO: 실제 API 연동
      // 예시: const response = await axios.get('https://api.krx.co.kr/gold-rate');
      
      // 임시 더미 데이터 (2024년 1월 기준 대략적인 시세)
      const dummyRates = {
        gold24K: 85000, // 원/g
        gold18K: 63750, // 원/g (24K의 75%)
        gold14K: 49583, // 원/g (24K의 58.3%)
      };

      // 오늘 날짜의 시세가 이미 있는지 확인
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingRate = await this.prisma.goldRate.findFirst({
        where: {
          date: {
            gte: today,
          },
        },
      });

      if (existingRate) {
        // 이미 있으면 업데이트
        return this.prisma.goldRate.update({
          where: { id: existingRate.id },
          data: dummyRates,
        });
      } else {
        // 없으면 생성
        return this.prisma.goldRate.create({
          data: dummyRates,
        });
      }
    } catch (error: any) {
      this.logger.error('Failed to update gold rates:', error.message);
      throw error;
    }
  }

  /**
   * 금 무게(g)를 원화로 환산
   */
  async convertGoldToKRW(weightInGrams: number, karat: '24K' | '18K' | '14K' = '24K') {
    const rates = await this.getLatestRate();
    if (!rates) {
      throw new Error('금 시세 정보를 가져올 수 없습니다.');
    }

    let pricePerGram: number;
    switch (karat) {
      case '24K':
        pricePerGram = rates.gold24K;
        break;
      case '18K':
        pricePerGram = rates.gold18K;
        break;
      case '14K':
        pricePerGram = rates.gold14K;
        break;
      default:
        pricePerGram = rates.gold24K;
    }

    return Math.round(weightInGrams * pricePerGram);
  }

  /**
   * 원화를 금 무게(g)로 환산
   */
  async convertKRWToGold(amountInKRW: number, karat: '24K' | '18K' | '14K' = '24K') {
    const rates = await this.getLatestRate();
    if (!rates) {
      throw new Error('금 시세 정보를 가져올 수 없습니다.');
    }

    let pricePerGram: number;
    switch (karat) {
      case '24K':
        pricePerGram = rates.gold24K;
        break;
      case '18K':
        pricePerGram = rates.gold18K;
        break;
      case '14K':
        pricePerGram = rates.gold14K;
        break;
      default:
        pricePerGram = rates.gold24K;
    }

    return parseFloat((amountInKRW / pricePerGram).toFixed(2));
  }

  /**
   * 금 시세 히스토리 조회 (통계용)
   */
  async getGoldRateHistory(days: number = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return this.prisma.goldRate.findMany({
      where: {
        date: {
          gte: fromDate,
        },
      },
      orderBy: { date: 'desc' },
    });
  }
}
