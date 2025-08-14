import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CacheService } from 'src/common/cache/cache.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateHymnDto } from './dto/create-hymn.dto';
import { User } from '@prisma/client';
import { AppUtilities } from 'src/common/utilities';
import { UpdateHymnDto } from './dto/update-hymn.dto';
import { AuditLogService } from 'src/audit-log/audit-log.service';

@Injectable()
export class HymnService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private auditService: AuditLogService,
  ) {}

  /**
   * Creates a new hymn with the provided data.
   * @param createData
   * @param user
   * @returns The created hymn data.
   * @throws ConflictException if a hymn with the same number already exists.
   */
  async createHymn(createData: CreateHymnDto, user: User) {
    const { number, title, categoryId, author } = createData;
    const slug = AppUtilities.slugify(title);
    try {
      const createdHymn = await this.prisma.hymn.create({
        data: {
          number,
          title,
          slug,
          categoryId,
          author,
          createdAt: new Date(),
          updatedBy: user.id,
        },
      });

      await this.auditService.log({
        action: 'CREATE',
        entityType: 'HYMN',
        entityId: user.id,
        userId: user.id,
        description: `Hymn ${title} with slug ${slug} was created in Category ${categoryId} by  user ${user.id}`,
      });

      return createdHymn;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Hymn already exists.');
      } else {
        throw new NotFoundException(
          'An error occurred while creating the hymn.',
        );
      }
    }
  }

  /**
   * Fetches all hymns from the database.
   * @returns An array of hymn data.
   */
  async fetchHymns() {
    try {
      const hymns = await this.prisma.hymn.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      return hymns;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches a hymn by its ID, including related categories, choruses, and verses.
   * @param id - The ID of the hymn to fetch.
   * @returns The hymn data along with its related entities.
   * @throws NotFoundException if the hymn does not exist.
   */
  async fetchHymnById(id: string) {
    try {
      const hymn = await this.prisma.hymn.findUniqueOrThrow({
        where: { id },
        include: {
          category: true,
          choruses: true,
          verses: {
            orderBy: { order: 'asc' },
          },
        },
      });
      return hymn;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Hymn not found.');
      }
      throw new NotFoundException('An error occurred while fetching the hymn.');
    }
  }

  /**
   * Updates an existing hymn with the provided data.
   * @param id
   * @param updateData
   * @param user
   * @returns The updated hymn data.
   * @throws NotFoundException if the hymn does not exist.
   */
  async updateHymn(id: string, updateData: UpdateHymnDto, user: User) {
    const { number, title, categoryId, author } = updateData;
    const slug = AppUtilities.slugify(title);
    try {
      const updatedHymn = await this.prisma.hymn.update({
        where: { id },
        data: {
          number,
          title,
          slug,
          categoryId,
          author,
          updatedBy: user.id,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          number: true,
          title: true,
          slug: true,
          categoryId: true,
        },
      });
      return updatedHymn;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Hymn not found.');
      }
      throw new NotFoundException('An error occurred while updating the hymn.');
    }
  }

  /**
   * Deletes a hymn and its related verses and choruses.
   * This method performs a soft delete by setting the deletedAt field.
   * @param id - The ID of the hymn to delete.
   * @param user - The user performing the deletion.
   * @returns The deleted hymn data.
   * @throws NotFoundException if the hymn does not exist or is already deleted.
   */
  async deleteHymn(id: string, user: User) {
    try {
      const deletedAt = new Date();

      // Use transaction to ensure all related data is updated atomically
      const result = await this.prisma.$transaction(async (prisma) => {
        // First, verify the hymn exists and isn't already deleted
        const hymn = await prisma.hymn.findFirst({
          where: {
            id,
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
            number: true,
          },
        });

        if (!hymn) {
          throw new NotFoundException('Hymn not found or already deleted');
        }

        // Update hymn
        const deletedHymn = await prisma.hymn.update({
          where: { id },
          data: {
            deletedAt,
            updatedBy: user.id,
            updatedAt: new Date(),
          },
          select: {
            id: true,
            title: true,
            number: true,
            deletedAt: true,
            updatedBy: true,
            updatedAt: true,
          },
        });

        // Update all related verses
        await prisma.verse.updateMany({
          where: {
            hymnId: id,
            deletedAt: null, // Only update non-deleted verses
          },
          data: {
            deletedAt,
            updatedBy: user.id,
            updatedAt: new Date(),
          },
        });

        // Update all related choruses
        await prisma.chorus.updateMany({
          where: {
            hymnId: id,
            deletedAt: null, // Only update non-deleted choruses
          },
          data: {
            deletedAt,
            updatedBy: user.id,
            updatedAt: new Date(),
          },
        });

        return deletedHymn;
      });

      return {
        message: 'Hymn and related content deleted successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Hymn not found');
      }

      throw new InternalServerErrorException(
        'An error occurred while deleting the hymn',
      );
    }
  }

  /**
   * Permanently deletes a hymn and its related verses and choruses.
   * @param id - The ID of the hymn to permanently delete.
   * @returns The deleted hymn data.
   * @throws NotFoundException if the hymn does not exist.
   */
  async permanentlyDeleteHymn(id: string, user: User) {
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const hymn = await prisma.hymn.findUnique({
          where: { id },
          select: { id: true, title: true },
        });

        if (!hymn) {
          throw new NotFoundException('Hymn not found');
        }

        // Delete all related verses first
        await prisma.verse.deleteMany({
          where: { hymnId: id },
        });

        // Delete all related choruses
        await prisma.chorus.deleteMany({
          where: { hymnId: id },
        });

        // Delete the hymn
        await prisma.hymn.delete({
          where: { id },
        });

        await prisma.auditLog.create({
          data: {
            action: 'DELETE',
            entityType: 'HYMN',
            entityId: id,
            userId: user.id,
            details: {
              description: `Hymn with ID ${id} was permanently deleted.`,
            },
          },
        });

        return hymn;
      });

      return {
        message: 'Hymn permanently deleted',
        data: result,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Hymn not found');
      }

      throw new InternalServerErrorException(
        'An error occurred while permanently deleting the hymn',
      );
    }
  }

  /**
   * Restores a soft-deleted hymn and its related verses and choruses.
   * @param id - The ID of the hymn to restore.
   * @param user - The user performing the restoration.
   * @returns The restored hymn data.
   */
  async restoreHymn(id: string, user: User) {
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        // Find the soft-deleted hymn
        const hymn = await prisma.hymn.findFirst({
          where: {
            id,
            deletedAt: { not: null }, // Only find deleted hymns
          },
          select: { id: true, title: true },
        });

        if (!hymn) {
          throw new NotFoundException('Deleted hymn not found');
        }

        // Restore the hymn
        const restoredHymn = await prisma.hymn.update({
          where: { id },
          data: {
            deletedAt: null,
            updatedBy: user.id,
            updatedAt: new Date(),
          },
          select: {
            id: true,
            title: true,
            number: true,
            updatedBy: true,
            updatedAt: true,
          },
        });

        // Restore all related verses
        await prisma.verse.updateMany({
          where: {
            hymnId: id,
            deletedAt: { not: null }, // Only restore deleted verses
          },
          data: {
            deletedAt: null,
            updatedBy: user.id,
            updatedAt: new Date(),
          },
        });

        // Restore all related choruses
        await prisma.chorus.updateMany({
          where: {
            hymnId: id,
            deletedAt: { not: null }, // Only restore deleted choruses
          },
          data: {
            deletedAt: null,
            updatedBy: user.id,
            updatedAt: new Date(),
          },
        });

        return restoredHymn;
      });

      return {
        message: 'Hymn and related content restored successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Hymn not found');
      }

      throw new InternalServerErrorException(
        'An error occurred while restoring the hymn',
      );
    }
  }
}
