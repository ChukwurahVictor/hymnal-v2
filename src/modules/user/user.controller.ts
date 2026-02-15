import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt.guard';
import { ResponseMessage } from 'src/common/decorators/response.decorator';

@ApiBearerAuth()
@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fetch all users.' })
  @ResponseMessage({ message: 'Users fetched successfully.' })
  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fetch a user.' })
  @ResponseMessage({ message: 'User fetched successfully.' })
  async getUser(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new user.' })
  @ResponseMessage({ message: 'User created successfully.' })
  async createUser() {
    return this.userService.createUser();
  }
}
