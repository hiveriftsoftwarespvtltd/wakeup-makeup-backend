import { ToNumber } from '../../utils/type-tranformer';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';



export class CreateServiceReviewDto {
  @IsMongoId()
  bookingId!: string;

  @IsMongoId()
  serviceId!: string;

  @IsMongoId()
  serviceProviderId!: string;

  @ToNumber()

  @IsNumber()
  @ToNumber()
  @Min(1)
  @Max(5)
  providerRating!: number;

  @IsOptional()
  @IsString()
  providerReview?: string;

  @ToNumber()

  @IsNumber()
  @ToNumber()
  @Min(1)
  @Max(5)
  serviceRating!: number;

  @IsOptional()
  @IsString()
  serviceReview?: string;
}

export class UpdateServiceReviewDto extends PartialType(CreateServiceReviewDto) { }
