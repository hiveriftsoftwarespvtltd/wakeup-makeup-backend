import {
  IsBoolean,
  IsEmail,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { InfluencerStatus } from '../schema/influencer.schema';

export class CreateInfluencerDto {
  // @IsString()
  // userId!: string;
  @IsEmail()
  email!:string;

  @IsString()
  password!:string;

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

  @IsOptional()
  @IsNumber()
  commissionRate?: number;

   @IsOptional()
  @IsNumber()
  followers?: number;
}



export class UpdateInfluencerDto {
  
  @IsMongoId()
  userId!:string

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

  @IsOptional()
  @IsNumber()
  commissionRate?: number;

   @IsOptional()
  @IsNumber()
  followers?: number;


   @IsOptional()
  @IsString()
  status?: InfluencerStatus;

  @IsOptional()
  @IsBoolean()
  isActive?:boolean
}