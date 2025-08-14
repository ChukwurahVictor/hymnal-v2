import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateChorusDto } from './dto/create-chorus.dto';
import { User } from '@prisma/client';
import { UpdateChorusDto } from './dto/update-chorus.dto';

@Injectable()
export class ChorusService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new chorus with the provided data.
   * @param createData
   * @param user
   * @returns The created chorus data.
   * @throws ConflictException if a chorus with the same text already exists.
   */
  async createChorus(createData: CreateChorusDto, user?: User) {
    const { hymnId, text } = createData;

    try {
      const chorus = await this.prisma.chorus.create({
        data: {
          hymnId,
          text,
          createdAt: new Date(),
          updatedBy: user?.id || null,
        },
      });

      return chorus;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Chorus with this text already exists');
      }
      throw error;
    }
  }

  /**
   * Fetches a single chorus by its ID.
   * @param id
   * @returns NotFoundException if the chorus does not exist.
   */
  async fetchChorusById(id: string) {
    try {
      const chorus = await this.prisma.chorus.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          text: true,
          createdAt: true,
          updatedAt: true,
          hymnId: true,
        },
      });
      return chorus;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Chorus not found.');
      }
      throw error;
    }
  }

  /**
   * Updates an existing chorus with the provided data.
   * @param id - The ID of the chorus to update.
   * @param updateData - The data to update the chorus with.
   * @param user - The user performing the update.
   * @throws NotFoundException if the chorus does not exist.
   * @returns The updated chorus data.
   */
  async updateChorus(id: string, updateData: UpdateChorusDto, user: User) {
    const { text } = updateData;
    try {
      const updatedChorus = await this.prisma.chorus.update({
        where: { id },
        data: {
          text,
          updatedAt: new Date(),
          updatedBy: user.id,
        },
        select: {
          id: true,
          text: true,
          createdAt: true,
          updatedAt: true,
          hymnId: true,
        },
      });
      return updatedChorus;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Chorus not found.');
      }
      throw error;
    }
  }

  /**
   * Deletes a chorus by its ID.
   * This method performs a soft delete by setting the deletedAt field.
   * @param id - The ID of the chorus to delete.
   * @param user - The user performing the deletion.
   * @returns The deleted chorus data.
   * @throws NotFoundException if the chorus does not exist or is already deleted.
   */
  async deleteChorus(id: string, user: User) {
    try {
      const deletedChorus = await this.prisma.chorus.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: user.id,
        },
        select: {
          id: true,
          text: true,
          createdAt: true,
          updatedAt: true,
          hymnId: true,
        },
      });
      return deletedChorus;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Chorus not found or already deleted.');
      }
      throw error;
    }
  }
}
