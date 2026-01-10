import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLedgerGroupDto } from './dto/create-ledger-group.dto';
import { UpdateLedgerGroupDto } from './dto/update-ledger-group.dto';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async createGroup(createLedgerGroupDto: CreateLedgerGroupDto) {
    return this.prisma.ledgerGroup.create({
      data: createLedgerGroupDto,
    });
  }

  async findAllGroups(userId: string) {
    return this.prisma.ledgerGroup.findMany({
      where: { userId },
      include: {
        contacts: true,
        transactions: {
          include: {
            contact: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOneGroup(id: string) {
    const group = await this.prisma.ledgerGroup.findUnique({
      where: { id },
      include: {
        user: true,
        contacts: true,
        transactions: {
          include: {
            contact: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Ledger group with ID ${id} not found`);
    }

    return group;
  }

  async updateGroup(id: string, updateLedgerGroupDto: UpdateLedgerGroupDto) {
    try {
      return await this.prisma.ledgerGroup.update({
        where: { id },
        data: updateLedgerGroupDto,
      });
    } catch (error) {
      throw new NotFoundException(`Ledger group with ID ${id} not found`);
    }
  }

  async removeGroup(id: string) {
    try {
      return await this.prisma.ledgerGroup.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Ledger group with ID ${id} not found`);
    }
  }
}
