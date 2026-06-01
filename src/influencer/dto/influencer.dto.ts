import {
  IsBoolean,
  IsEmail,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { InfluencerStatus } from '../schema/influencer.schema';

export class CreateInfluencerDto {
  // @IsString()
  // userId!: string;
  // @IsEmail()
  // email!: string;

  @IsString()
  token!:string

  @IsString()
  password!: string;
  

  // @IsString()
  // name!: string;

  // @IsString()
  // referralCode!: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  youtube?: string;

  @IsOptional()
  @IsString()
  tiktok?: string;

  // @IsOptional()
  // @IsNumber()
  // commissionRate?: number;

  @IsOptional()
  @IsNumber()
  followers?: number;
}

export class UpdateInfluencerDto {
  @IsMongoId()
  userId!: string;

  @IsString()
  name!: string;

  // @IsString()
  // referralCode!: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  youtube?: string;

  @IsOptional()
  @IsString()
  tiktok?: string;

  // @IsOptional()
  // @IsNumber()
  // commissionRate?: number;

  @IsOptional()
  @IsNumber()
  followers?: number;

  @IsOptional()
  @IsString()
  status?: InfluencerStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class createSlabDTO {
  @IsNumber()
  @Min(0)
  minSales!: number;

  @IsNumber()
  @Min(0)
  maxSales!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate!: number;
}

export class UpdateSlabDTO {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSales?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSales?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99)
  commissionRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
