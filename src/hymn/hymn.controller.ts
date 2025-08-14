import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HymnService } from './hymn.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CreateHymnDto } from './dto/create-hymn.dto';
import { User } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UpdateHymnDto } from 'src/hymn/dto/update-hymn.dto';

@ApiBearerAuth()
@ApiTags('Hymn')
@Controller('hymns')
export class HymnController {
  constructor(private readonly hymnService: HymnService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new hymn.' })
  @ResponseMessage({ message: 'Hymn created successfully.' })
  async createHymn(
    @Body() createHymnDto: CreateHymnDto,
    @GetUser() user: User,
  ) {
    return this.hymnService.createHymn(createHymnDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fetch all hymns.' })
  @ResponseMessage({ message: 'Hymns fetched successfully.' })
  async fetchAllHymns() {
    return this.hymnService.fetchHymns();
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a hymn.' })
  @ResponseMessage({ message: 'Hymn deleted successfully.' })
  async deleteHymn(@Param('id') id: string, @GetUser() user: User) {
    return this.hymnService.deleteHymn(id, user);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Permanently delete a hymn.' })
  @ResponseMessage({ message: 'Hymn permanently deleted successfully.' })
  async permanentlyDeleteHymn(@Param('id') id: string, @GetUser() user: User) {
    return this.hymnService.permanentlyDeleteHymn(id, user);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Restore a deleted hymn.' })
  @ResponseMessage({ message: 'Hymn restored successfully.' })
  async restoreHymn(@Param('id') id: string, @GetUser() user: User) {
    return this.hymnService.restoreHymn(id, user);
  }
}
