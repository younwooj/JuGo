import axios from 'axios';
import { client } from './client';

// 금 시세 정보 타입
export interface GoldRate {
  id: string;
  date: string;
  gold24K: number;
  gold18K: number;
  gold14K: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

// 금 환산 결과 타입
export interface GoldConversion {
  weight?: number;
  karat?: string;
  amountInKRW?: number;
}

/**
 * 최신 금 시세 조회
 */
export const getLatestGoldRate = async (): Promise<GoldRate> => {
  const response = await client.get('/gold/rate');
  return response.data;
};

/**
 * 금 시세 수동 업데이트
 */
export const updateGoldRate = async (): Promise<GoldRate> => {
  const response = await client.post('/gold/rate/update');
  return response.data;
};

/**
 * 금(g) -> 원화 환산
 */
export const convertGoldToKRW = async (
  weight: number,
  karat: '24K' | '18K' | '14K' = '24K',
): Promise<GoldConversion> => {
  const response = await client.get('/gold/convert/to-krw', {
    params: { weight, karat },
  });
  return response.data;
};

/**
 * 원화 -> 금(g) 환산
 */
export const convertKRWToGold = async (
  amount: number,
  karat: '24K' | '18K' | '14K' = '24K',
): Promise<GoldConversion> => {
  const response = await client.get('/gold/convert/to-gold', {
    params: { amount, karat },
  });
  return response.data;
};

/**
 * 금 시세 히스토리 조회
 */
export const getGoldRateHistory = async (days: number = 30): Promise<GoldRate[]> => {
  const response = await client.get('/gold/history', {
    params: { days },
  });
  return response.data;
};
