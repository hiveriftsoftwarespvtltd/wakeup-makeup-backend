import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  productId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  review?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  images?: string[];
}

export class UpdateReviewDto extends PartialType(
  CreateReviewDto,
) {}