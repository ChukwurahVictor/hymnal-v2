import { AppUtilities } from 'src/common/utilities';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { User } from '@prisma/client';
import { UpdateCategoryDto } from './dto/update-cateogry.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new category with the provided data.
   * @param createData
   * @param user
   * @returns ConflictException if a category with the same name already exists.
   */
  async createCategory(createData: CreateCategoryDto, user: User) {
    const { name } = createData;
    const slug = AppUtilities.slugify(name);

    try {
      const category = await this.prisma.category.create({
        data: {
          name,
          // description,
          slug,
          createdById: user.id,
          createdAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          // description: true,
          slug: true,
          createdAt: true,
          createdBy: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      return category;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Fetches all categories.
   * @returns An array of categories.
   * @throws NotFoundException if no categories are found.
   */
  async fetchCategories() {
    try {
      const categories = await this.prisma.category.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      return categories;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('No categories found');
      }
      throw error;
    }
  }

  /**
   * Fetches a single category by its ID.
   * @param id - The ID of the category to fetch.
   * @returns The category data.
   * @throws NotFoundException if the category does not exist.
   */
  async fetchCategoryById(id: string) {
    try {
      const category = await this.prisma.category.findUniqueOrThrow({
        where: { id },
      });
      return category;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }
      throw error;
    }
  }

  /**
   * Updates an existing category with the provided data.
   * @param id - The ID of the category to update.
   * @param updateData - The data to update the category with.
   * @param user - The user performing the update.
   * @returns The updated category data.
   * @throws NotFoundException if the category does not exist.
   */
  async updateCategory(id: string, updateData: UpdateCategoryDto, user: User) {
    try {
      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
          updatedById: user.id,
        },
        select: {
          id: true,
          name: true,
          // description: true,
          updatedAt: true,
        },
      });

      return updatedCategory;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }
      throw error;
    }
  }

  /**
   * Deletes a category and marks it as deleted.
   * This method performs a soft delete by setting the deletedAt field.
   * @param id - The ID of the category to delete.
   * @param user - The user performing the deletion.
   * @returns The deleted category data.
   * @throws NotFoundException if the category does not exist or is already deleted.
   */
  async deleteCategory(id: string, user: User) {
    try {
      const deletedCategory = await this.prisma.category.update({
        where: {
          id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          updatedById: user.id,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          deletedAt: true,
        },
      });

      return deletedCategory;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Category not found or already deleted');
      }
      throw error;
    }
  }
}
