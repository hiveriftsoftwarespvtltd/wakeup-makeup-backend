import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { VehicleType } from '../schema/delivery-person.schema';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class CreateDeliveryPersonDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  phone: number;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;
}

export class UpdateDeliveryPersonDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  phone: number;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive: boolean;
}
