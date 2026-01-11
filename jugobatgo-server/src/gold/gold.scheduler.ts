import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoldService } from '../gold/gold.service';

@Injectable()
export class GoldScheduler {
  private readonly logger = new Logger(GoldScheduler.name);

  constructor(private readonly goldService: GoldService) {}

  /**
   * 매일 오전 9시에 금 시세 업데이트
   * 한국 증권시장 개장 시간 기준
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async updateDailyGoldRates() {
    this.logger.log('📈 금 시세 자동 업데이트 시작 (오전 9시)');
    try {
      await this.goldService.updateGoldRates();
      this.logger.log('✅ 금 시세 자동 업데이트 완료');
    } catch (error: any) {
      this.logger.error('❌ 금 시세 자동 업데이트 실패:', error.message);
    }
  }

  /**
   * 매일 오후 3시에 금 시세 업데이트
   * 한국 증권시장 종료 시간 기준
   */
  @Cron('0 15 * * *')
  async updateAfternoonGoldRates() {
    this.logger.log('📈 금 시세 자동 업데이트 시작 (오후 3시)');
    try {
      await this.goldService.updateGoldRates();
      this.logger.log('✅ 금 시세 자동 업데이트 완료');
    } catch (error: any) {
      this.logger.error('❌ 금 시세 자동 업데이트 실패:', error.message);
    }
  }

  /**
   * 앱 시작 시 금 시세 초기화
   * 서버 재시작 시 최신 시세 확보
   */
  async onModuleInit() {
    this.logger.log('🚀 서버 시작 - 금 시세 초기 로딩');
    try {
      const latestRate = await this.goldService.getLatestRate();
      if (latestRate) {
        this.logger.log(`✅ 최신 금 시세: 24K=${latestRate.gold24K}원/g`);
      } else {
        this.logger.log('⚠️  금 시세 없음 - 초기 데이터 생성');
        await this.goldService.updateGoldRates();
      }
    } catch (error: any) {
      this.logger.error('❌ 금 시세 초기화 실패:', error.message);
    }
  }
}
