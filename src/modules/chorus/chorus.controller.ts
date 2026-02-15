import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChorusService } from './chorus.service';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { CreateChorusDto } from './dto/create-chorus.dto';
import { User } from '@prisma/client';
import { UpdateChorusDto } from './dto/update-chorus.dto';

@ApiBearerAuth()
@ApiTags('Chorus')
@Controller('chorus')
export class ChorusController {
  constructor(private readonly chorusService: ChorusService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a Chorus.' })
  @ResponseMessage({ message: 'Chorus created successfully.' })
  async createChorus(@Body() createChorusDto: CreateChorusDto, user: User) {
    return this.chorusService.createChorus(createChorusDto, user);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fetch a Chorus.' })
  @ResponseMessage({ message: 'Chorus fetched successfully.' })
  async fetchChorus(@Param() id: string) {
    return this.chorusService.fetchChorusById(id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a Chorus.' })
  @ResponseMessage({ message: 'Chorus updated successfully.' })
  async updateChorus(
    @Param('id') id: string,
    @Body() updateChorusDto: UpdateChorusDto,
    user: User,
  ) {
    return this.chorusService.updateChorus(id, updateChorusDto, user);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a Chorus.' })
  @ResponseMessage({ message: 'Chorus deleted successfully.' })
  async deleteChorus(@Param('id') id: string, user: User) {
    return this.chorusService.deleteChorus(id, user);
  }
}
