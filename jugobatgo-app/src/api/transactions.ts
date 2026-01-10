import apiClient from './client';

export interface Transaction {
  id: string;
  contactId: string;
  ledgerGroupId: string;
  type: 'GIVE' | 'RECEIVE';
  category: 'CASH' | 'GIFT' | 'GOLD';
  amount: number;
  originalName: string | null;
  goldInfo: any | null;
  memo: string | null;
  eventDate: string | null;
  createdAt: string;
  updatedAt: string;
  contact: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  ledgerGroup: {
    id: string;
    name: string;
  };
}

export const transactionsApi = {
  // 모든 거래 조회
  getAll: async (): Promise<Transaction[]> => {
    const response = await apiClient.get('/transactions');
    return response.data;
  },

  // 특정 거래 조회
  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  },

  // 연락처별 거래 조회
  getByContact: async (contactId: string): Promise<Transaction[]> => {
    const response = await apiClient.get(`/transactions/contact/${contactId}`);
    return response.data;
  },

  // 거래 생성
  create: async (data: {
    contactId: string;
    ledgerGroupId: string;
    type: 'GIVE' | 'RECEIVE';
    category: 'CASH' | 'GIFT' | 'GOLD';
    amount: number;
    originalName?: string;
    goldInfo?: any;
    memo?: string;
    eventDate?: string;
  }): Promise<Transaction> => {
    const response = await apiClient.post('/transactions', data);
    return response.data;
  },

  // 거래 수정
  update: async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
    const response = await apiClient.put(`/transactions/${id}`, data);
    return response.data;
  },

  // 거래 삭제
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },
};
