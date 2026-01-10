import { Controller, Post, Body, UseInterceptors, UploadedFile, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('estimate-from-image')
  @ApiOperation({ summary: '이미지에서 선물 가격 추정' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  async estimateFromImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('이미지가 제공되지 않았습니다');
    }

    this.logger.log(`이미지 분석 요청: ${file.originalname}, ${file.size} bytes`);

    // Base64로 변환
    const base64Image = file.buffer.toString('base64');

    // AI 분석
    const estimation = await this.aiService.estimateGiftFromImage(base64Image);

    this.logger.log(`분석 완료: ${estimation.giftName} - ${estimation.estimatedPrice}원`);

    return estimation;
  }

  @Post('estimate-from-text')
  @ApiOperation({ summary: '텍스트에서 선물 가격 추정' })
  async estimateFromText(@Body() body: { giftName: string }) {
    if (!body.giftName) {
      throw new Error('선물 이름이 제공되지 않았습니다');
    }

    this.logger.log(`텍스트 분석 요청: ${body.giftName}`);

    const estimation = await this.aiService.estimateGiftFromText(body.giftName);

    this.logger.log(`분석 완료: ${estimation.giftName} - ${estimation.estimatedPrice}원`);

    return estimation;
  }
}
