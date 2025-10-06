import { Escape, Trim } from 'class-sanitizer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @Trim()
  @Escape()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @Trim()
  @Escape()
  newPassword: string;
}
