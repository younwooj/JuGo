import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: '연락처 생성' })
  @ApiResponse({ status: 201, description: '연락처가 생성되었습니다.' })
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @Get()
  @ApiOperation({ summary: '사용자의 모든 연락처 조회' })
  @ApiQuery({ name: 'userId', required: true, description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '연락처 목록을 반환합니다.' })
  findAll(@Query('userId') userId: string) {
    return this.contactsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 연락처 조회' })
  @ApiResponse({ status: 200, description: '연락처 정보를 반환합니다.' })
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '연락처 정보 수정' })
  @ApiResponse({ status: 200, description: '연락처 정보가 수정되었습니다.' })
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '연락처 삭제' })
  @ApiResponse({ status: 200, description: '연락처가 삭제되었습니다.' })
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}
