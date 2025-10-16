import { NormalizeEmail } from 'class-sanitizer';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @NormalizeEmail()
  email: string;
}
