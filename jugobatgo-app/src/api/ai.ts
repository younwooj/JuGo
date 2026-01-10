import apiClient from './client';

export interface GiftEstimation {
  giftName: string;
  estimatedPrice: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
}

export const aiApi = {
  // 이미지에서 선물 가격 추정
  estimateFromImage: async (imageUri: string): Promise<GiftEstimation> => {
    // 이미지를 Base64로 변환하여 전송
    const formData = new FormData();
    
    // Web에서는 fetch로 이미지를 가져와서 blob으로 변환
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    formData.append('image', blob, 'image.jpg');

    const result = await apiClient.post('/ai/estimate-from-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return result.data;
  },

  // 텍스트에서 선물 가격 추정
  estimateFromText: async (giftName: string): Promise<GiftEstimation> => {
    const response = await apiClient.post('/ai/estimate-from-text', { giftName });
    return response.data;
  },
};
