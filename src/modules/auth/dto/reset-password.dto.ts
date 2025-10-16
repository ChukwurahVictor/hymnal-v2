import { Escape, Trim } from 'class-sanitizer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @Escape()
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @Trim()
  @Escape()
  token: string;
}
