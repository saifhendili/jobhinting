import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  }

  async getAll(params: { page: number; limit: number; search?: string }) {
    const where: Prisma.UserWhereInput = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, lastLoginAt: true },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }
}

export const userRepository = new UserRepository();
