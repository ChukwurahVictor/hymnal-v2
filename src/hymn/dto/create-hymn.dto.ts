import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateHymnDto {
  @IsInt()
  @IsOptional()
  number?: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsOptional()
  author?: string;
}
