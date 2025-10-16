import { Escape, NormalizeEmail, Trim } from 'class-sanitizer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @NormalizeEmail()
  @IsNotEmpty({ message: 'email is required.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'password is required.' })
  @Trim()
  @Escape()
  password: string;
}
