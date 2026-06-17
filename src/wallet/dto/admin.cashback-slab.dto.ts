import { IsEnum, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { CashbackType } from '../schema/cashback/cashbacks.slabs.schema';

export class CreateCashbackSlabDto {
    @IsNumber()
    minValue!: number;

    @IsNumber()
    maxValue!: number;

    @IsNumber()
    cashbackValue!: number;

    @IsEnum(CashbackType)
    @IsOptional()
    cashbackType?: CashbackType;

    @IsNumber()
    @IsOptional()
    maxCashback?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateCashbackSlabDto {
    @IsNumber()
    @IsOptional()
    minValue?: number;

    @IsNumber()
    @IsOptional()
    maxValue?: number;

    @IsNumber()
    @IsOptional()
    cashbackValue?: number;

    @IsEnum(CashbackType)
    @IsOptional()
    cashbackType?: CashbackType;

    @IsNumber()
    @IsOptional()
    maxCashback?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
