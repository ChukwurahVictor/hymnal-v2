import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VerseService } from './verse.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CreateVerseDto } from './dto/create-verse.dto';
import { User } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@ApiBearerAuth()
@ApiTags('Verses')
@Controller('verses')
export class VerseController {
  constructor(private readonly verseService: VerseService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a verse.' })
  @ResponseMessage({ message: 'Verse created successfully.' })
  async createVerse(
    @Body() createVerseDto: CreateVerseDto,
    @GetUser() user: User,
  ) {
    return this.verseService.createVerse(createVerseDto, user);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fetch a verse.' })
  @ResponseMessage({ message: 'Verse fetched successfully.' })
  async fetchVerse(@Param('id') id: string) {
    return this.verseService.fetchVerseById(id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a verse.' })
  @ResponseMessage({ message: 'Verse updated successfully.' })
  async updateVerse() {
    return this.verseService.updateVerse();
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a verse.' })
  @ResponseMessage({ message: 'Verse deleted successfully.' })
  async deleteVerse(@Param('id') id: string, user: User) {
    return this.verseService.deleteVerse(id, user);
  }
}
