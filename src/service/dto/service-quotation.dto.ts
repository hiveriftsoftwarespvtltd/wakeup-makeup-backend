import { ToNumber } from '../../utils/type-tranformer';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum, IsBoolean, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { QuotationItemType } from '../schema/service-quotation.schema';



export class QuotationItemDto {
    @IsEnum(QuotationItemType)
    type!: QuotationItemType;

    @IsOptional()
    @IsString()
    serviceId?: string;

    @IsString()
    title!: string;

    @ToNumber()

    @IsNumber()
    @Min(1)
    quantity!: number;

    @ToNumber()

    @IsNumber()
    @Min(0)
    unitCostPrice!: number;

    @ToNumber()

    @IsNumber()
    @Min(0)
    unitSellingPrice!: number;

    @ToNumber()

    @IsNumber()
    @Min(0)
    unitOfferedPrice!: number;
}

export class CreateServiceQuotationDto {
    @IsString()
    leadId!: string;

    @IsOptional()
    @IsString()
    note?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuotationItemDto)
    items!: QuotationItemDto[];

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    includedItems?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    excludedItems?: string[];

    @IsDateString()
    validTill!: string;

    @IsDateString()
    serviceDate!: string;

    @IsDateString()
    slotStartTime!: string;

    @IsDateString()
    slotEndTime!: string;

    @ToNumber()

    @IsNumber()
    @Min(1)
    requiredStaffCount!: number;

    @IsOptional()
    @IsString()
    customerName?: string;

    @IsOptional()
    @IsString()
    customerPhone?: string;

    @IsOptional()
    @IsString()
    customerEmail?: string;

    @IsOptional()
    @IsString()
    serviceAddress?: string;
}

export class UpdateServiceQuotationDto {
    // @IsOptional()
    // @IsString()
    // note?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuotationItemDto)
    items?: QuotationItemDto[];

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    includedItems?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    excludedItems?: string[];

    @IsOptional()
    @IsDateString()
    validTill?: string;

    @IsOptional()
    @IsString()
    customerName?: string;

    @IsOptional()
    @IsString()
    customerPhone?: string;

    @IsOptional()
    @IsString()
    customerEmail?: string;

    @IsOptional()
    @IsString()
    serviceAddress?: string;
}
