import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateChorusDto {
  @IsUUID()
  @IsNotEmpty()
  hymnId: string;

  @IsNotEmpty()
  text: string;
}
