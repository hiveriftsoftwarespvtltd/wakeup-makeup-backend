import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { ProductStatus } from '../schema/product.schema';

import { PartialType } from '@nestjs/mapped-types';


// ================= VARIANT DTO =================

export class CreateVariantDto {

  @IsString()
  sku!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salesPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock!: number;

  // media ids after upload

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  images?: string[];

  @IsOptional()
  @IsMongoId()
  thumbnail?: string;

  @IsObject()
  attributes!: Record<string, string>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}


// ================= PRODUCT DTO =================

export class CreateProductDto {

  @IsOptional()
  @IsMongoId()
  _id?: string;

  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  categoryId!: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants!: CreateVariantDto[];
}


// ================= UPDATE DTO =================

export class UpdateProductDto extends PartialType(
  CreateProductDto,
) {}