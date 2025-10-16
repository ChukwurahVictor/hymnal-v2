import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return await this.prisma.user.findMany();
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser() {
    return 'Create User';
  }

  async updateUser() {
    return 'Update User';
  }

  async deleteUser() {
    return 'Delete User';
  }
}
