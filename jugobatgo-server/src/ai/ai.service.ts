import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GiftEstimation {
  giftName: string;
  estimatedPrice: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      this.logger.warn('⚠️ Gemini API Key가 설정되지 않았습니다. AI 기능이 비활성화됩니다.');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.logger.log('✅ Gemini AI 초기화 완료');
    } catch (error) {
      this.logger.error('❌ Gemini AI 초기화 실패:', error);
    }
  }

  /**
   * 이미지에서 선물 정보 추정
   * @param imageBase64 Base64 인코딩된 이미지
   * @returns 선물 이름과 추정 가격
   */
  async estimateGiftFromImage(imageBase64: string): Promise<GiftEstimation> {
    if (!this.model) {
      throw new Error('Gemini API가 초기화되지 않았습니다. API 키를 확인하세요.');
    }

    try {
      // 이미지 데이터 준비
      const imageParts = [
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg',
          },
        },
      ];

      const prompt = `이 이미지에 있는 선물 또는 상품을 분석해주세요.
      
다음 정보를 JSON 형식으로 제공해주세요:
{
  "giftName": "상품명 (한국어)",
  "estimatedPrice": 추정 가격 (숫자만, 원 단위),
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "description": "간단한 설명 (선택)"
}

예시:
- 홍삼 제품이면: {"giftName": "정관장 홍삼 6년근", "estimatedPrice": 150000, "confidence": "HIGH"}
- 화장품 세트면: {"giftName": "설화수 자음생 세트", "estimatedPrice": 200000, "confidence": "MEDIUM"}
- 불명확하면: {"giftName": "선물 세트", "estimatedPrice": 50000, "confidence": "LOW"}

상품을 식별할 수 없으면 일반적인 카테고리와 예상 가격을 제시하세요.
반드시 유효한 JSON만 응답하세요.`;

      const result = await this.model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();

      this.logger.log(`AI 응답: ${text}`);

      // JSON 파싱
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI 응답에서 JSON을 찾을 수 없습니다');
      }

      const estimation: GiftEstimation = JSON.parse(jsonMatch[0]);

      // 유효성 검사
      if (!estimation.giftName || !estimation.estimatedPrice) {
        throw new Error('AI 응답이 올바르지 않습니다');
      }

      return estimation;
    } catch (error) {
      this.logger.error('AI 가격 추정 실패:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`AI 분석 실패: ${errorMessage}`);
    }
  }

  /**
   * 텍스트 기반 선물 가격 추정
   * @param giftName 선물 이름
   * @returns 추정 가격
   */
  async estimateGiftFromText(giftName: string): Promise<GiftEstimation> {
    if (!this.model) {
      throw new Error('Gemini API가 초기화되지 않았습니다. API 키를 확인하세요.');
    }

    try {
      const prompt = `"${giftName}" 선물의 일반적인 가격을 추정해주세요.
      
다음 정보를 JSON 형식으로 제공해주세요:
{
  "giftName": "정확한 상품명",
  "estimatedPrice": 추정 가격 (숫자만, 원 단위),
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "description": "간단한 설명"
}

반드시 유효한 JSON만 응답하세요.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI 응답에서 JSON을 찾을 수 없습니다');
      }

      const estimation: GiftEstimation = JSON.parse(jsonMatch[0]);
      return estimation;
    } catch (error) {
      this.logger.error('텍스트 기반 가격 추정 실패:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`AI 분석 실패: ${errorMessage}`);
    }
  }
}
