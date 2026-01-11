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
   * 금 시세 업데이트
   * 
   * 실제 구현 옵션:
   * 1. 한국금거래소 API (공식, 인증 필요)
   * 2. 공공데이터포털 금 시세 API (API Key 필요)
   * 3. 네이버 금융/다음 금융 크롤링 (비공식)
   * 
   * 현재: Mock 데이터 + 작은 변동성 추가 (실제 시세와 유사하게)
   */
  async updateGoldRates() {
    try {
      // 실제 API 연동 시 주석 해제
      // const goldRates = await this.fetchGoldRatesFromAPI();
      
      // Mock 데이터 생성 (2026년 1월 기준 대략적인 시세)
      const goldRates = this.generateMockGoldRates();

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
        this.logger.log(`금 시세 업데이트: 24K=${goldRates.gold24K}원/g`);
        return this.prisma.goldRate.update({
          where: { id: existingRate.id },
          data: goldRates,
        });
      } else {
        // 없으면 생성
        this.logger.log(`금 시세 생성: 24K=${goldRates.gold24K}원/g`);
        return this.prisma.goldRate.create({
          data: goldRates,
        });
      }
    } catch (error: any) {
      this.logger.error('금 시세 업데이트 실패:', error.message);
      throw error;
    }
  }

  /**
   * Mock 금 시세 데이터 생성
   * 실제 시세와 유사하게 작은 변동성 추가
   */
  private generateMockGoldRates() {
    // 기준 시세 (2026년 1월 평균 시세 추정)
    const base24K = 95000; // 원/g
    
    // ±2% 범위 내에서 랜덤 변동
    const variation = (Math.random() - 0.5) * 0.04; // -2% ~ +2%
    const gold24K = Math.round(base24K * (1 + variation));
    
    // 18K = 24K의 75% (순도 비율)
    const gold18K = Math.round(gold24K * 0.75);
    
    // 14K = 24K의 58.3% (순도 비율)
    const gold14K = Math.round(gold24K * 0.583);

    return {
      gold24K,
      gold18K,
      gold14K,
    };
  }

  /**
   * 실제 금 시세 API 호출 (사용 예시)
   * 한국금거래소 API 또는 공공데이터포털 API 사용
   */
  private async fetchGoldRatesFromAPI() {
    try {
      // 예시: 한국금거래소 API (실제 URL 및 인증키 필요)
      // const API_URL = 'https://www.koreagold.co.kr/api/gold-rate';
      // const API_KEY = process.env.GOLD_API_KEY;
      
      // const response = await axios.get(API_URL, {
      //   headers: {
      //     'Authorization': `Bearer ${API_KEY}`,
      //   },
      //   timeout: 10000,
      // });

      // return {
      //   gold24K: response.data.gold24k,
      //   gold18K: response.data.gold18k,
      //   gold14K: response.data.gold14k,
      // };

      throw new Error('실제 API 미구현');
    } catch (error: any) {
      this.logger.error('외부 금 시세 API 호출 실패:', error.message);
      // Fallback: Mock 데이터 사용
      return this.generateMockGoldRates();
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
