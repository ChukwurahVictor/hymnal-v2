import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';

@ApiBearerAuth()
@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a category.' })
  @ResponseMessage({ message: 'Category created successfully.' })
  async createCategory(
    @GetUser() user: User,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoryService.createCategory(createCategoryDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fetch all categories.' })
  @ResponseMessage({ message: 'Categories fetched successfully.' })
  async fetchAllCategories() {
    return this.categoryService.fetchCategories();
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fetch a category.' })
  @ResponseMessage({ message: 'Category fetched successfully.' })
  async fetchCategory(@Param('id') id: string) {
    return this.categoryService.fetchCategoryById(id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a category.' })
  @ResponseMessage({ message: 'Category updated successfully.' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: CreateCategoryDto,
    @GetUser() user: User,
  ) {
    return this.categoryService.updateCategory(id, updateCategoryDto, user);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a category.' })
  @ResponseMessage({ message: 'Category deleted successfully.' })
  async deleteCategory(@Param('id') id: string, @GetUser() user: User) {
    return this.categoryService.deleteCategory(id, user);
  }
}
