import { IsInt, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateVerseDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  text: string;

  @IsInt()
  order?: number;
}
