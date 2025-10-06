import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateVerseDto } from './dto/create-verse.dto';

@Injectable()
export class VerseService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fetches a verse by its ID.
   * @param id - The ID of the verse to fetch.
   * @throws NotFoundException if the verse does not exist.
   * @returns verse data
   */
  async fetchVerseById(id: string) {
    try {
      const verse = await this.prisma.verse.findUniqueOrThrow({
        where: { id: id },
        select: {
          id: true,
          text: true,
          createdAt: true,
          updatedAt: true,
          hymnId: true,
        },
      });
      return verse;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Verse not found.');
      }
      throw error;
    }
  }

  /**
   * Creates a new verse with the provided data.
   * @param createData - The data to create a new verse.
   * @param user - The user creating the verse.
   * @returns created verse data
   * @throws ConflictException if a verse with the same text already exists.
   */
  async createVerse(createData: CreateVerseDto, user: User) {
    const { hymnId, text, order } = createData;
    try {
      const createdVerse = await this.prisma.verse.create({
        data: {
          hymnId,
          text,
          order: order || null,
          createdAt: new Date(),
          updatedById: user?.id || null,
        },
      });
      return createdVerse;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Verse with this text already exists');
      }
      throw error;
    }
  }

  async updateVerse() {
    try {
      return 'Update verse';
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Verse not found.');
      }
      throw error;
    }
  }

  /**
   * Deletes a verse by its ID, marking it as deleted.
   * @param id - The ID of the verse to delete.
   * @param user - The user performing the deletion.
   * @returns The deleted verse data.
   * @throws NotFoundException if the verse does not exist.
   */
  async deleteVerse(id: string, user: User) {
    try {
      const deletedVerse = await this.prisma.verse.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedById: user.id,
        },
        select: {
          id: true,
          text: true,
          createdAt: true,
          updatedAt: true,
          hymnId: true,
        },
      });
      return deletedVerse;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Verse not found.');
      }
      throw error;
    }
  }
}
