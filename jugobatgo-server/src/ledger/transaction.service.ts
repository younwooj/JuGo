import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async create(createTransactionDto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: createTransactionDto,
      include: {
        contact: true,
        ledgerGroup: true,
      },
    });
  }

  async findAll(ledgerGroupId: string) {
    return this.prisma.transaction.findMany({
      where: { ledgerGroupId },
      include: {
        contact: true,
        ledgerGroup: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByContact(contactId: string) {
    return this.prisma.transaction.findMany({
      where: { contactId },
      include: {
        contact: true,
        ledgerGroup: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        contact: true,
        ledgerGroup: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async getSummary(ledgerGroupId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { ledgerGroupId },
    });

    const giveSum = transactions
      .filter((t) => t.type === 'GIVE')
      .reduce((sum, t) => sum + t.amount, 0);

    const receiveSum = transactions
      .filter((t) => t.type === 'RECEIVE')
      .reduce((sum, t) => sum + t.amount, 0);

    // 주받 온도 계산 (0~100)
    const temperature = this.calculateTemperature(giveSum, receiveSum);

    return {
      ledgerGroupId,
      totalTransactions: transactions.length,
      giveSum,
      receiveSum,
      balance: giveSum - receiveSum,
      temperature,
    };
  }

  private calculateTemperature(giveSum: number, receiveSum: number): number {
    if (giveSum + receiveSum === 0) return 50;
    const rawTemp = 50 + ((giveSum - receiveSum) / (giveSum + receiveSum)) * 50;
    return Math.min(Math.max(rawTemp, 0), 100); // 0~100 사이로 클램핑
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto) {
    try {
      return await this.prisma.transaction.update({
        where: { id },
        data: updateTransactionDto,
        include: {
          contact: true,
          ledgerGroup: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.transaction.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
  }
}
