import apiClient from './client';

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  ledgerGroupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const contactsApi = {
  // 모든 연락처 조회 (userId 필수)
  getAll: async (userId: string): Promise<Contact[]> => {
    const response = await apiClient.get('/contacts', {
      params: { userId },
    });
    return response.data;
  },

  // 특정 연락처 조회
  getById: async (id: string): Promise<Contact> => {
    const response = await apiClient.get(`/contacts/${id}`);
    return response.data;
  },

  // 이름으로 검색
  searchByName: async (userId: string, name: string): Promise<Contact[]> => {
    const contacts = await contactsApi.getAll(userId);
    return contacts.filter(c => c.name.includes(name));
  },

  // 전화번호로 검색 (userId 기준)
  findByPhone: async (userId: string, phoneNumber: string): Promise<Contact | null> => {
    const contacts = await contactsApi.getAll(userId);
    const normalized = phoneNumber.replace(/\D/g, '');
    return contacts.find(c => c.phoneNumber.replace(/\D/g, '') === normalized) || null;
  },

  // 연락처 생성
  create: async (data: {
    userId: string;
    name: string;
    phoneNumber: string;
    ledgerGroupId?: string;
  }): Promise<Contact> => {
    const response = await apiClient.post('/contacts', data);
    return response.data;
  },

  // 연락처 수정
  update: async (id: string, data: Partial<Contact>): Promise<Contact> => {
    const response = await apiClient.put(`/contacts/${id}`, data);
    return response.data;
  },

  // 연락처 삭제
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },

  // 연락처 찾거나 생성
  findOrCreate: async (data: {
    userId: string;
    name: string;
    phoneNumber: string;
    ledgerGroupId?: string;
  }): Promise<Contact> => {
    const existing = await contactsApi.findByPhone(data.userId, data.phoneNumber);
    if (existing) return existing;
    return await contactsApi.create(data);
  },

  // 대량 업서트 (Batch Upsert) — 서버 한 번 호출로 처리
  batchUpsert: async (
    userId: string,
    contacts: Array<{ name: string; phoneNumber: string }>,
  ): Promise<{
    success: Array<{ id: string; name: string; phoneNumber: string }>;
    failed: Array<{ contact: { name: string; phoneNumber: string }; error: string }>;
  }> => {
    if (contacts.length === 0) {
      return { success: [], failed: [] };
    }
    const response = await apiClient.post('/contacts/batch-upsert', {
      userId,
      contacts: contacts.map(({ name, phoneNumber }) => ({ name, phoneNumber })),
    });
    return response.data;
  },
};
