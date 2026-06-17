import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SeedDataDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    users?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    vendors?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    educators?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    providers?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    influencers?: number;
}