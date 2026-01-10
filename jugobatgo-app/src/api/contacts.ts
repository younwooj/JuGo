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
  // 모든 연락처 조회
  getAll: async (): Promise<Contact[]> => {
    const response = await apiClient.get('/contacts');
    return response.data;
  },

  // 특정 연락처 조회
  getById: async (id: string): Promise<Contact> => {
    const response = await apiClient.get(`/contacts/${id}`);
    return response.data;
  },

  // 이름으로 검색
  searchByName: async (name: string): Promise<Contact[]> => {
    const response = await apiClient.get('/contacts');
    const contacts: Contact[] = response.data;
    return contacts.filter(c => c.name.includes(name));
  },

  // 전화번호로 검색
  findByPhone: async (phoneNumber: string): Promise<Contact | null> => {
    const response = await apiClient.get('/contacts');
    const contacts: Contact[] = response.data;
    return contacts.find(c => c.phoneNumber === phoneNumber) || null;
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
    // 전화번호로 먼저 검색
    const existing = await contactsApi.findByPhone(data.phoneNumber);
    if (existing) {
      return existing;
    }
    // 없으면 새로 생성
    return await contactsApi.create(data);
  },
};
