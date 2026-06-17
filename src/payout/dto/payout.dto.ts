import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';

export class SettleVendorPayoutDto {
  @IsMongoId()
  vendorId!: string;

  @IsArray()
  @IsMongoId({ each: true })
  vendorOrderIds!: string[];

  @IsString()
  @IsNotEmpty()
  transactionId!: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  month?: number;

  @IsOptional()
  @IsInt()
  @Min(2024)
  year?: number;
}

export class SettleInfluencerPayoutDto {
  @IsMongoId()
  influencerId!: string;

  @IsArray()
  @IsMongoId({ each: true })
  commissionIds!: string[];

  @IsString()
  @IsNotEmpty()
  transactionId!: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  month?: number;

  @IsOptional()
  @IsInt()
  @Min(2024)
  year?: number;
}

export class SettleVendorPendingBalanceDto {
  @IsMongoId()
  vendorId!: string;

  @IsArray()
  @IsMongoId({ each: true })
  vendorOrderIds!: string[];
}

export class SettleInfluencerPendingBalanceDto {
  @IsMongoId()
  influencerId!: string;

  @IsArray()
  @IsMongoId({ each: true })
  commissionIds!: string[];
}

export class SettleServiceProviderPendingBalanceDto {
  @IsMongoId()
  serviceProviderId!: string;

  @IsArray()
  @IsMongoId({ each: true })
  serviceBookingIds!: string[];
}

export class SettleEducatorPendingBalanceDto {
  @IsMongoId()
  educatorId!: string;

  @IsArray()
  @IsMongoId({ each: true })
  coursePurchaseIds!: string[];
}