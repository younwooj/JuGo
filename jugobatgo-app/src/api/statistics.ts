import { client } from './client';

// 통계 타입 정의
export interface UserStatistics {
  totalGiveAmount: number;
  totalReceiveAmount: number;
  balance: number;
  transactionCount: number;
  contactCount: number;
  ledgerGroupCount: number;
  jubadTemperature: number;
  recentTransactions: Array<{
    id: string;
    type: 'GIVE' | 'RECEIVE';
    category: 'CASH' | 'GIFT' | 'GOLD';
    amount: number;
    eventDate: string;
    contact: { name: string };
    ledgerGroup: { name: string };
  }>;
}

export interface CategoryStatistics {
  CASH: { give: number; receive: number; count: number };
  GIFT: { give: number; receive: number; count: number };
  GOLD: { give: number; receive: number; count: number };
}

export interface MonthlyStatistics {
  [monthKey: string]: {
    give: number;
    receive: number;
    balance: number;
  };
}

export interface TopContact {
  id: string;
  name: string;
  phoneNumber: string;
  give: number;
  receive: number;
  balance: number;
  total: number;
  transactionCount: number;
}

export interface LedgerGroupStatistics {
  id: string;
  name: string;
  give: number;
  receive: number;
  balance: number;
  transactionCount: number;
}

/**
 * 사용자 전체 통계 조회
 */
export const getUserStatistics = async (userId: string): Promise<UserStatistics> => {
  const response = await client.get(`/statistics/user/${userId}`);
  return response.data;
};

/**
 * 주밥 온도 조회
 */
export const getJubadTemperature = async (userId: string): Promise<number> => {
  const response = await client.get(`/statistics/user/${userId}/jubad-temperature`);
  return response.data.temperature;
};

/**
 * 카테고리별 통계
 */
export const getCategoryStatistics = async (userId: string): Promise<CategoryStatistics> => {
  const response = await client.get(`/statistics/user/${userId}/category`);
  return response.data;
};

/**
 * 월별 통계 (최근 12개월)
 */
export const getMonthlyStatistics = async (userId: string): Promise<MonthlyStatistics> => {
  const response = await client.get(`/statistics/user/${userId}/monthly`);
  return response.data;
};

/**
 * 거래 많은 연락처 Top 10
 */
export const getTopContacts = async (userId: string): Promise<TopContact[]> => {
  const response = await client.get(`/statistics/user/${userId}/top-contacts`);
  return response.data;
};

/**
 * 장부 그룹별 통계
 */
export const getLedgerGroupStatistics = async (
  userId: string
): Promise<LedgerGroupStatistics[]> => {
  const response = await client.get(`/statistics/user/${userId}/ledger-groups`);
  return response.data;
};
