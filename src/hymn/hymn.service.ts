import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CacheService } from 'src/common/cache/cache.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateHymnDto } from './dto/create-hymn.dto';
import { Prisma, User } from '@prisma/client';
import { AppUtilities } from 'src/common/utilities';
import { UpdateHymnDto } from './dto/update-hymn.dto';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { CrudService } from '@@/common/database/crud.service';
import { FetchHymnsDto } from '@@/hymn/dto/fetch-hymn.dto';
import { CacheKeysEnums } from '@@/common/cache/cache.enum';
import { CloudinaryService } from '@@/common/cloudinary/cloudinary.service';

@Injectable()
export class HymnService extends CrudService<Prisma.HymnDelegate, any> {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private auditService: AuditLogService,
    private cloudinaryService: CloudinaryService,
  ) {
    super(prisma.hymn);
  }

  /**
   * Creates a new hymn with the provided data and uploads optional solfa image.
   * @param createData The data for creating the hymn.
   * @param user The user creating the hymn.
   * @param file Optional solfa image file.
   * @returns The created hymn data including solfa image.
   * @throws ConflictException if a hymn with the same number or slug already exists.
   */
  async createHymn(
    createData: CreateHymnDto,
    user: User,
    file?: Express.Multer.File,
  ) {
    console.log('Create Hymn Data:', createData);
    const {
      number,
      title,
      categoryId,
      author,
      language,
      version,
      verses,
      choruses,
    } = createData;
    const slug = AppUtilities.slugify(title);

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Create hymn Record
        const hymn = await tx.hymn.create({
          data: {
            number,
            title,
            slug,
            categoryId,
            author,
            language,
            version,
            createdById: user.id,
            updatedById: user.id,
          },
        });

        // Upload solfa image (if any)
        if (file) {
          const uploadResult = await this.cloudinaryService.uploadImage(
            file,
            'hymns/solfa',
            file.originalname,
          );

          await tx.solfaImage.create({
            data: {
              hymnId: hymn.id,
              imageUrl: uploadResult?.secure_url,
              createdById: user.id,
            },
          });
        }

        // Create verses (if any)
        if (verses?.length) {
          await tx.verse.createMany({
            data: verses.map((v, idx) => ({
              hymnId: hymn.id,
              text: v.text,
              order: v.order ?? idx + 1,
              createdById: user.id,
            })),
          });
        }

        // Step 4: Create choruses (if any)
        if (choruses?.length) {
          await tx.chorus.createMany({
            data: choruses.map((c, idx) => ({
              hymnId: hymn.id,
              text: c.text,
              order: c.order ?? idx + 1,
              createdById: user.id,
            })),
          });
        }

        // Log audit
        await this.auditService.log({
          action: 'CREATE',
          entityType: 'HYMN',
          entityId: hymn.id,
          userId: user.id,
          description: `Hymn "${title}" created with ${verses?.length ?? 0} verses and ${choruses?.length ?? 0} choruses by user ${user.id}`,
        });

        // Return hymn with relations
        return await tx.hymn.findUnique({
          where: { id: hymn.id },
          include: {
            verses: true,
            choruses: true,
            solfaImages: true,
            category: true,
          },
        });
      });
    } catch (error) {
      console.error('Error creating hymn:', error);

      if (error.code === 'P2002') {
        throw new ConflictException(
          'A hymn with this title or number already exists.',
        );
      }

      throw new NotFoundException('An error occurred while creating the hymn.');
    }
  }

  /**
   * Fetches all hymns from the database.
   * @returns An array of hymn data.
   */
  async fetchHymns({
    orderBy,
    direction,
    cursor,
    size,
    ...dto
  }: FetchHymnsDto) {
    const parsedFilterQuery = await this.parseQueryFilter(dto, [
      'title|contains',
      'number|equals',
      'author|contains',
    ]);

    // Generate a cache key (unique to query + pagination params)
    const cacheKey = `${CacheKeysEnums.HYMNS}:${JSON.stringify({
      orderBy,
      direction,
      cursor,
      size,
      ...dto,
    })}`;

    try {
      // Check cache first
      const cachedData = await this.cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const args: Prisma.HymnFindManyArgs = {
        where: {
          deletedAt: null,
          ...parsedFilterQuery,
        },
        include: {
          category: true,
        },
        orderBy: orderBy
          ? { [orderBy]: direction ?? 'asc' }
          : { createdAt: 'desc' },
      };

      const result = await this.findManyPaginate(args, {
        cursor,
        direction,
        orderBy: orderBy,
        size,
      });

      // Cache the result for future requests
      await this.cacheService.set(cacheKey, result, 300000);

      return result;
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
          updatedById: user.id,
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
            updatedById: user.id,
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
            updatedById: user.id,
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
            updatedById: user.id,
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
            deletedAt: { not: null },
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
            updatedById: user.id,
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
            deletedAt: { not: null },
          },
          data: {
            deletedAt: null,
            updatedById: user.id,
            updatedAt: new Date(),
          },
        });

        // Restore all related choruses
        await prisma.chorus.updateMany({
          where: {
            hymnId: id,
            deletedAt: { not: null },
          },
          data: {
            deletedAt: null,
            updatedById: user.id,
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
