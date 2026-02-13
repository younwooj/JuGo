import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { BatchUpsertContactsDto, BatchUpsertContactItemDto } from './dto/batch-upsert-contacts.dto';

/** 전화번호 정규화: 숫자만 추출 (중복 판별·upsert용) */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '') || phone;
}

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto) {
    return this.prisma.contact.create({
      data: createContactDto,
    });
  }

  async findAll(userId: string) {
    return this.prisma.contact.findMany({
      where: { userId },
      include: {
        ledgerGroup: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        user: true,
        ledgerGroup: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto) {
    try {
      return await this.prisma.contact.update({
        where: { id },
        data: updateContactDto,
      });
    } catch (error) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.contact.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
  }

  /**
   * 연락처 대량 업서트: userId + 전화번호 기준으로 있으면 이름 갱신, 없으면 생성.
   * 전화번호는 숫자만으로 정규화하여 중복을 방지한다.
   */
  async batchUpsert(dto: BatchUpsertContactsDto): Promise<{
    success: Array<{ id: string; name: string; phoneNumber: string }>;
    failed: Array<{ contact: BatchUpsertContactItemDto; error: string }>;
  }> {
    const success: Array<{ id: string; name: string; phoneNumber: string }> = [];
    const failed: Array<{ contact: BatchUpsertContactItemDto; error: string }> = [];
    const { userId, contacts } = dto;

    for (const item of contacts) {
      try {
        const normalized = normalizePhone(item.phoneNumber);
        if (!normalized.length) {
          failed.push({ contact: item, error: '전화번호가 비어 있습니다.' });
          continue;
        }

        const phoneForDb = normalizePhone(item.phoneNumber);
        const rawPhone = item.phoneNumber.trim();

        const existing = await this.prisma.contact.findFirst({
          where: {
            userId,
            OR: [
              { phoneNumber: phoneForDb },
              { phoneNumber: rawPhone },
            ],
          },
        });

        if (existing) {
          await this.prisma.contact.update({
            where: { id: existing.id },
            data: { name: item.name, updatedAt: new Date() },
          });
          success.push({
            id: existing.id,
            name: item.name,
            phoneNumber: existing.phoneNumber,
          });
        } else {
          const created = await this.prisma.contact.create({
            data: {
              userId,
              name: item.name,
              phoneNumber: phoneForDb,
            },
          });
          success.push({
            id: created.id,
            name: created.name,
            phoneNumber: created.phoneNumber,
          });
        }
      } catch (err: any) {
        failed.push({
          contact: item,
          error: err?.message || '처리 실패',
        });
      }
    }

    return { success, failed };
  }
}
