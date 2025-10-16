import { IsInt, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateVerseDto {
  @IsUUID()
  @IsNotEmpty()
  hymnId: string;

  @IsNotEmpty()
  text: string;

  @IsInt()
  order?: number;
}
