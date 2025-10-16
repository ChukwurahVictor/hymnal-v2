import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateHymnDto {
  @IsInt()
  @IsOptional()
  number?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsOptional()
  author?: string;
}
