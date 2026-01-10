import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

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
}
