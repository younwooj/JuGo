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
    try {
      // 이미지를 fetch로 가져와서 blob으로 변환
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // FormData 생성
      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');

      // API 호출 (Content-Type은 자동 설정됨)
      const result = await apiClient.post('/ai/estimate-from-image', formData);

      return result.data;
    } catch (error: any) {
      console.error('이미지 업로드 실패:', error);
      throw new Error(error.response?.data?.message || '이미지 분석에 실패했습니다');
    }
  },

  // 텍스트에서 선물 가격 추정
  estimateFromText: async (giftName: string): Promise<GiftEstimation> => {
    try {
      const response = await apiClient.post('/ai/estimate-from-text', { giftName });
      return response.data;
    } catch (error: any) {
      console.error('텍스트 분석 실패:', error);
      throw new Error(error.response?.data?.message || '가격 추정에 실패했습니다');
    }
  },
};
