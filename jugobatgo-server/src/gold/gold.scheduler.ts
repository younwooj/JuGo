import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoldService } from '../gold/gold.service';

@Injectable()
export class GoldScheduler {
  private readonly logger = new Logger(GoldScheduler.name);

  constructor(private readonly goldService: GoldService) {}

  /**
   * 매일 오전 9시에 금 시세 업데이트
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async updateDailyGoldRates() {
    this.logger.log('금 시세 자동 업데이트 시작');
    try {
      await this.goldService.updateGoldRates();
      this.logger.log('금 시세 자동 업데이트 완료');
    } catch (error: any) {
      this.logger.error('금 시세 자동 업데이트 실패:', error.message);
    }
  }

  /**
   * 매시간마다 금 시세 업데이트 (실시간성 확보)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateHourlyGoldRates() {
    this.logger.log('금 시세 시간별 업데이트 시작');
    try {
      await this.goldService.updateGoldRates();
      this.logger.log('금 시세 시간별 업데이트 완료');
    } catch (error: any) {
      this.logger.error('금 시세 시간별 업데이트 실패:', error.message);
    }
  }
}
