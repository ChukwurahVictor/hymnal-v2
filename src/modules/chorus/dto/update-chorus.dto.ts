import { IsNotEmpty } from 'class-validator';

export class UpdateChorusDto {
  @IsNotEmpty()
  text: string;
}
