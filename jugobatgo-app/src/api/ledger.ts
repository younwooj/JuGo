import apiClient from './client';

export interface LedgerGroup {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const ledgerApi = {
  // 모든 장부 그룹 조회
  getAll: async (): Promise<LedgerGroup[]> => {
    const response = await apiClient.get('/ledger/groups');
    return response.data;
  },

  // 특정 장부 그룹 조회
  getById: async (id: string): Promise<LedgerGroup> => {
    const response = await apiClient.get(`/ledger/groups/${id}`);
    return response.data;
  },

  // 장부 그룹 생성
  create: async (data: { userId: string; name: string }): Promise<LedgerGroup> => {
    const response = await apiClient.post('/ledger/groups', data);
    return response.data;
  },

  // 장부 그룹 수정
  update: async (id: string, data: { name: string }): Promise<LedgerGroup> => {
    const response = await apiClient.put(`/ledger/groups/${id}`, data);
    return response.data;
  },

  // 장부 그룹 삭제
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/ledger/groups/${id}`);
  },
};
