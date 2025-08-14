import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @Transform(({ value }) => value && value.trim().toLowerCase())
  @IsNotEmpty({ message: 'email is required.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'password is required.' })
  password: string;
}
