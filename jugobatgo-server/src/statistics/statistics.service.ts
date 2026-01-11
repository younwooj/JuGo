import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 사용자 전체 통계 조회
   */
  async getUserStatistics(userId: string) {
    const [
      totalGive,
      totalReceive,
      transactionCount,
      contactCount,
      ledgerGroupCount,
      jubadTemperature,
      recentTransactions,
    ] = await Promise.all([
      // 총 준 금액
      this.prisma.transaction.aggregate({
        where: {
          contact: { userId },
          type: 'GIVE',
        },
        _sum: { amount: true },
      }),
      // 총 받은 금액
      this.prisma.transaction.aggregate({
        where: {
          contact: { userId },
          type: 'RECEIVE',
        },
        _sum: { amount: true },
      }),
      // 총 거래 수
      this.prisma.transaction.count({
        where: { contact: { userId } },
      }),
      // 연락처 수
      this.prisma.contact.count({
        where: { userId },
      }),
      // 장부 그룹 수
      this.prisma.ledgerGroup.count({
        where: { userId },
      }),
      // 주밥 온도 계산
      this.calculateJubadTemperature(userId),
      // 최근 거래 10건
      this.prisma.transaction.findMany({
        where: { contact: { userId } },
        include: {
          contact: { select: { name: true } },
          ledgerGroup: { select: { name: true } },
        },
        orderBy: { eventDate: 'desc' },
        take: 10,
      }),
    ]);

    const totalGiveAmount = totalGive._sum.amount || 0;
    const totalReceiveAmount = totalReceive._sum.amount || 0;
    const balance = totalReceiveAmount - totalGiveAmount;

    return {
      totalGiveAmount,
      totalReceiveAmount,
      balance,
      transactionCount,
      contactCount,
      ledgerGroupCount,
      jubadTemperature,
      recentTransactions,
    };
  }

  /**
   * 주밥 온도 계산
   * 
   * 알고리즘:
   * - 기본 온도: 36.5도
   * - 받은 금액 > 준 금액: 온도 상승 (최대 +5도)
   * - 준 금액 > 받은 금액: 온도 하강 (최대 -5도)
   * - 거래 빈도에 따라 가중치 부여
   */
  async calculateJubadTemperature(userId: string): Promise<number> {
    const [totalGive, totalReceive, transactionCount] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          contact: { userId },
          type: 'GIVE',
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          contact: { userId },
          type: 'RECEIVE',
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.count({
        where: { contact: { userId } },
      }),
    ]);

    const totalGiveAmount = totalGive._sum.amount || 0;
    const totalReceiveAmount = totalReceive._sum.amount || 0;

    // 기본 온도
    let temperature = 36.5;

    if (transactionCount === 0) {
      return temperature;
    }

    // 금액 비율에 따른 온도 변화
    const balance = totalReceiveAmount - totalGiveAmount;
    const totalAmount = totalGiveAmount + totalReceiveAmount;

    if (totalAmount > 0) {
      const ratio = balance / totalAmount;
      // ratio는 -1 ~ 1 사이 값
      // ratio가 양수면 받은 게 많음 (온도 상승)
      // ratio가 음수면 준 게 많음 (온도 하강)
      temperature += ratio * 5; // 최대 ±5도
    }

    // 거래 빈도에 따른 보너스 (활발한 인간관계 = 따뜻함)
    if (transactionCount >= 50) {
      temperature += 1;
    } else if (transactionCount >= 20) {
      temperature += 0.5;
    }

    // 온도 범위 제한: 30도 ~ 42도
    temperature = Math.max(30, Math.min(42, temperature));

    // 소수점 첫째자리까지
    return Math.round(temperature * 10) / 10;
  }

  /**
   * 카테고리별 통계
   */
  async getCategoryStatistics(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { contact: { userId } },
      select: {
        category: true,
        amount: true,
        type: true,
      },
    });

    const stats = {
      CASH: { give: 0, receive: 0, count: 0 },
      GIFT: { give: 0, receive: 0, count: 0 },
      GOLD: { give: 0, receive: 0, count: 0 },
    };

    transactions.forEach((t) => {
      stats[t.category].count++;
      if (t.type === 'GIVE') {
        stats[t.category].give += t.amount;
      } else {
        stats[t.category].receive += t.amount;
      }
    });

    return stats;
  }

  /**
   * 월별 통계 (최근 12개월)
   */
  async getMonthlyStatistics(userId: string) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        contact: { userId },
        eventDate: { gte: twelveMonthsAgo },
      },
      select: {
        eventDate: true,
        createdAt: true, // fallback용 추가
        amount: true,
        type: true,
      },
      orderBy: { eventDate: 'asc' },
    });

    // 월별 집계
    const monthlyStats: Record<
      string,
      { give: number; receive: number; balance: number }
    > = {};

    transactions.forEach((t) => {
      // eventDate가 null일 경우 createdAt 사용
      const date = t.eventDate || t.createdAt;
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { give: 0, receive: 0, balance: 0 };
      }
      if (t.type === 'GIVE') {
        monthlyStats[monthKey].give += t.amount;
      } else {
        monthlyStats[monthKey].receive += t.amount;
      }
      monthlyStats[monthKey].balance =
        monthlyStats[monthKey].receive - monthlyStats[monthKey].give;
    });

    return monthlyStats;
  }

  /**
   * 연락처별 통계 (Top 10)
   */
  async getTopContactStatistics(userId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { userId },
      include: {
        transactions: {
          select: {
            amount: true,
            type: true,
          },
        },
      },
    });

    const contactStats = contacts.map((contact) => {
      const give = contact.transactions
        .filter((t) => t.type === 'GIVE')
        .reduce((sum, t) => sum + t.amount, 0);
      const receive = contact.transactions
        .filter((t) => t.type === 'RECEIVE')
        .reduce((sum, t) => sum + t.amount, 0);
      const balance = receive - give;
      const total = give + receive;

      return {
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        give,
        receive,
        balance,
        total,
        transactionCount: contact.transactions.length,
      };
    });

    // 총 거래액 기준 정렬
    return contactStats.sort((a, b) => b.total - a.total).slice(0, 10);
  }

  /**
   * 장부 그룹별 통계
   */
  async getLedgerGroupStatistics(userId: string) {
    const groups = await this.prisma.ledgerGroup.findMany({
      where: { userId },
      include: {
        transactions: {
          select: {
            amount: true,
            type: true,
          },
        },
      },
    });

    return groups.map((group) => {
      const give = group.transactions
        .filter((t) => t.type === 'GIVE')
        .reduce((sum, t) => sum + t.amount, 0);
      const receive = group.transactions
        .filter((t) => t.type === 'RECEIVE')
        .reduce((sum, t) => sum + t.amount, 0);
      const balance = receive - give;

      return {
        id: group.id,
        name: group.name,
        give,
        receive,
        balance,
        transactionCount: group.transactions.length,
      };
    });
  }
}
