import { IsNotEmpty, IsString } from 'class-validator';

export class RequestResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  email: string;
}
