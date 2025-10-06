import { AppUtilities } from 'src/common/utilities';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { HymnService } from './hymn.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CreateHymnDto } from './dto/create-hymn.dto';
import { User } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UpdateHymnDto } from 'src/hymn/dto/update-hymn.dto';
import { Throttle } from '@nestjs/throttler';
import { FetchHymnsDto } from '@@/hymn/dto/fetch-hymn.dto';
import { AdminAuthGuard } from '@@/auth/guard/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseJsonPipe } from '@@/common/utilities/parse-json.pipe';

@ApiBearerAuth()
@ApiTags('Hymn')
@Controller('hymns')
export class HymnController {
  constructor(private readonly hymnService: HymnService) {}

  @Post()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Create a new hymn.' })
  @ResponseMessage({ message: 'Hymn created successfully.' })
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateHymnDto })
  async createHymn(
    @UploadedFile() image: Express.Multer.File,
    @GetUser() user: User,
    @Body('verses', ParseJsonPipe) versesRaw: any,
    @Body('choruses', ParseJsonPipe) chorusesRaw: any,
    @Body() createHymnDto: any,
  ) {
    if (typeof createHymnDto.number === 'string') {
      createHymnDto.number = parseInt(createHymnDto.number, 10);
    }

    const verses = AppUtilities.parseArray(versesRaw);
    const choruses = AppUtilities.parseArray(chorusesRaw);

    console.log('Parsed Create Hymn DTO:', createHymnDto);
    return this.hymnService.createHymn(
      { ...createHymnDto, verses, choruses },
      user,
      image,
    );
  }

  @Get()
  @Throttle({ default: { ttl: 20000, limit: 5 } })
  @ApiOperation({ summary: 'Fetch all hymns.' })
  @ResponseMessage({ message: 'Hymns fetched successfully.' })
  async fetchAllHymns(@Query() dto: FetchHymnsDto) {
    return this.hymnService.fetchHymns(dto);
  }

  @Get('/:id')
  @Throttle({ default: { ttl: 20000, limit: 5 } })
  @ApiOperation({ summary: 'Fetch a hymn.' })
  @ResponseMessage({ message: 'Hymn fetched successfully.' })
  async fetchHymnById(@Param('id') id: string) {
    return this.hymnService.fetchHymnById(id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a hymn.' })
  @ResponseMessage({ message: 'Hymn updated successfully.' })
  async updateHymn(
    @Param('id') id: string,
    @Body() updateHymnDto: UpdateHymnDto,
    @GetUser() user: User,
  ) {
    return this.hymnService.updateHymn(id, updateHymnDto, user);
  }

  @Patch('/:id/delete')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Delete a hymn.' })
  @ResponseMessage({ message: 'Hymn deleted successfully.' })
  async deleteHymn(@Param('id') id: string, @GetUser() user: User) {
    return this.hymnService.deleteHymn(id, user);
  }

  @Delete('/:id')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Permanently delete a hymn.' })
  @ResponseMessage({ message: 'Hymn permanently deleted successfully.' })
  async permanentlyDeleteHymn(@Param('id') id: string, @GetUser() user: User) {
    return this.hymnService.permanentlyDeleteHymn(id, user);
  }

  @Post(':id/restore')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Restore a deleted hymn.' })
  @ResponseMessage({ message: 'Hymn restored successfully.' })
  async restoreHymn(@Param('id') id: string, @GetUser() user: User) {
    return this.hymnService.restoreHymn(id, user);
  }
}
