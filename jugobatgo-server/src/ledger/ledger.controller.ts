import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { CreateLedgerGroupDto } from './dto/create-ledger-group.dto';
import { UpdateLedgerGroupDto } from './dto/update-ledger-group.dto';

@ApiTags('ledger')
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post('groups')
  @ApiOperation({ summary: '장부 그룹 생성' })
  @ApiResponse({ status: 201, description: '장부 그룹이 생성되었습니다.' })
  createGroup(@Body() createLedgerGroupDto: CreateLedgerGroupDto) {
    return this.ledgerService.createGroup(createLedgerGroupDto);
  }

  @Get('groups')
  @ApiOperation({ summary: '사용자의 모든 장부 그룹 조회' })
  @ApiQuery({ name: 'userId', required: true, description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '장부 그룹 목록을 반환합니다.' })
  findAllGroups(@Query('userId') userId: string) {
    return this.ledgerService.findAllGroups(userId);
  }

  @Get('groups/:id')
  @ApiOperation({ summary: '특정 장부 그룹 조회' })
  @ApiResponse({ status: 200, description: '장부 그룹 정보를 반환합니다.' })
  @ApiResponse({ status: 404, description: '장부 그룹을 찾을 수 없습니다.' })
  findOneGroup(@Param('id') id: string) {
    return this.ledgerService.findOneGroup(id);
  }

  @Put('groups/:id')
  @ApiOperation({ summary: '장부 그룹 정보 수정' })
  @ApiResponse({ status: 200, description: '장부 그룹 정보가 수정되었습니다.' })
  updateGroup(@Param('id') id: string, @Body() updateLedgerGroupDto: UpdateLedgerGroupDto) {
    return this.ledgerService.updateGroup(id, updateLedgerGroupDto);
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: '장부 그룹 삭제' })
  @ApiResponse({ status: 200, description: '장부 그룹이 삭제되었습니다.' })
  removeGroup(@Param('id') id: string) {
    return this.ledgerService.removeGroup(id);
  }
}
