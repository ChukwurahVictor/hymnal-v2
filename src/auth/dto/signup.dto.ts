import { Escape, NormalizeEmail, Trim } from 'class-sanitizer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  @Trim()
  @Escape()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Trim()
  @Escape()
  lastName: string;

  @IsEmail()
  @NormalizeEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Trim()
  @Escape()
  password: string;
}
