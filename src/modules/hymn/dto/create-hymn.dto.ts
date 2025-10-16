import { ApiPropertyOptional } from '@nestjs/swagger';
import { Escape, Trim } from 'class-sanitizer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class VerseDto {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @Escape()
  text: string;

  @IsOptional()
  @IsInt()
  order?: number;
}

class ChorusDto {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @Escape()
  text: string;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateHymnDto {
  @IsOptional()
  @IsInt()
  number?: number;

  @IsNotEmpty()
  @IsString()
  @Trim()
  @Escape()
  title: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @Trim()
  @Escape()
  author?: string;

  @IsOptional()
  @IsString()
  @Trim()
  @Escape()
  language?: string;

  @IsOptional()
  @IsString()
  @Trim()
  @Escape()
  version?: string;

  @IsOptional()
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Solfa image file',
  })
  image?: Express.Multer.File;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerseDto)
  verses?: VerseDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChorusDto)
  choruses?: ChorusDto[];
}
