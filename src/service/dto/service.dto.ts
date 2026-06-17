import { Transform, Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, IsArray, Min, Max, IsEnum, ValidateNested, IsDateString, ArrayMinSize, IsDate, ArrayMaxSize } from "class-validator";
import { ServiceType, ServiceGender } from "../schema/service.schema";
import { WeekDay } from "../schema/service-availability.schema";
import { ServiceProviderGender } from "../schema/service-provider.schema";
import { GENDER } from "../schema/service-staff.schema";
import { ServiceLeadGender } from "../schema/service-lead.schema";


export class CreateServiceCategoryDTO {

  @IsString()
  name!: string

  @IsString()
  label!: string

  @IsString()
  description!: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean
}

export class UpdateServiceCategoryDTO extends CreateServiceCategoryDTO { }

export class CreateServiceSubscriptionPlanDTO {
  @IsString()
  name!: string

  @IsString()
  label!: string

  @IsNumber()
  durationDays!: number

  @IsNumber()
  price!: number

  @IsNumber()
  maxServices!: number

  @IsNumber()
  maxStaff!: number

  @IsNumber()
  monthlyLeadLimit!: number

  @IsNumber()
  commissionPercentage!: number

  @IsBoolean()
  featuredListing!: boolean

  @IsBoolean()
  prioritySupport!: boolean

  @IsBoolean()
  analyticsAccess!: boolean

  @IsOptional()
  @IsBoolean()
  isActive?: boolean


  @IsNumber()
  priorityRank!: number

}

export class UpdateServiceSubscriptionPlanDTO extends CreateServiceSubscriptionPlanDTO { }

export class CreateServiceProviderDTO {
  @IsString()
  businessName!: string;


  @IsString()
  description?: string;


  @IsNumber()
  experienceYears?: number;


  @IsString()
  phone: string;


  // @IsString()
  // email: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  panNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  providerType?: string;

  @IsOptional()
  @IsBoolean()
  homeServiceAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  salonVisitAvailable?: boolean;

  @IsOptional()
  @IsArray()
  coordinates?: number[];

  @IsOptional()
  @IsNumber()
  serviceRadiusKm?: number;

  @IsOptional()
  @IsEnum(ServiceProviderGender)
  providedGenderService?: ServiceProviderGender;
}

export class UpdateServiceProviderDTO {
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  experienceYears?: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  panNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  providerType?: string;

  @IsOptional()
  @IsBoolean()
  homeServiceAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  salonVisitAvailable?: boolean;

  @IsOptional()
  @IsArray()
  coordinates?: number[];

  @IsOptional()
  @IsNumber()
  serviceRadiusKm?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(ServiceProviderGender)
  providedGenderService?: ServiceProviderGender;
}

export class CreateServiceDTO {
  @IsString()
  categoryId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  durationMinutes!: number;
  @Type(() => Number)
  @IsNumber()
  costPrice!: number;

  @Type(() => Number)
  @IsNumber()
  sellingPrice!: number;

  @Type(() => Number)
  @IsNumber()
  offeredPrice!: number;

  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @IsOptional()
  @IsEnum(ServiceGender)
  serviceGender?: ServiceGender;
}

export class UpdateServiceDTO {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  costPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sellingPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offeredPrice?: number;

  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @IsOptional()
  @Transform((value) => Boolean(value))
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(ServiceGender)
  serviceGender?: ServiceGender;
}

export class CreateStaffDTO {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  experienceYears?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsEnum(GENDER)
  gender!: GENDER;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];
}

export class UpdateStaffDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  experienceYears?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(GENDER)
  gender?: GENDER;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];
}

export class UpdateAvailabilityDTO {
  @IsEnum(WeekDay)
  dayOfWeek!: WeekDay;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;


  @IsString()
  breakStart!: string;

  @IsString()
  breakEnd!: string;
}

export class CreateProviderAvailabilityDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAvailabilityDTO)
  availabilities!: UpdateAvailabilityDTO[];
}

export class UpdateAvailabilityListDTO {
  @IsArray()
  availabilities!: UpdateAvailabilityDTO[];
}

export class GetSlotsDTO {
  @IsArray()
  @IsString({ each: true })
  serviceIds!: string[];

  @IsString()
  date!: string;
}

// export class CreateBookingDTO {
//   @IsString()
//   serviceId!: string;

//   @IsString()
//   staffId!: string;

//   @IsString()
//   bookingDate!: string;

//   @IsString()
//   slotStartTime!: string;

//   @IsString()
//   slotEndTime!: string;

//   @IsOptional()
//   @IsString()
//   serviceAddress?: string;

//   @IsOptional()
//   @IsString()
//   couponCode?: string;
// }

export class BookingItemInputDTO {
  @IsString()
  serviceId!: string;
}

import { PaymentMethod } from "src/order/schema/order.schema";

export class CreateBookingDTO {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingItemInputDTO)
  items?: BookingItemInputDTO[];

  @IsString()
  staffId!: string;

  @IsString()
  serviceProviderId!: string;

  @IsDateString()
  bookingDate!: string;

  @IsDateString()
  slotStartTime!: string;

  @IsOptional()
  @IsString()
  serviceAddress?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}

export class UpdateBookingStatusDTO {
  @IsString()
  status!: string;
}

export class RescheduleBookingDTO {
  @IsDateString()
  bookingDate!: string;

  @IsDateString()
  slotStartTime!: string;

  // @IsString()
  // slotEndTime!: string;
}

export class CreateReviewDTO {
  @IsString()
  bookingId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  review!: string;
}

class LocationDTO {
  @IsString()
  type!: 'Point';

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  coordinates!: [number, number];
}

export class CreateLeadDTO {
  @IsArray()
  @IsString({ each: true })
  categoryIds!: string[];

  @IsString()
  requirement!: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;


  @IsNumber()
  budget!: number;

  @IsDateString()
  preferredDate!: string;

  @IsString()
  address!: string;

  @IsString()
  pincode!: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDTO)
  location?: LocationDTO;

  @IsString()
  phoneNumber!: string;

  @IsEnum(ServiceLeadGender)
  gender!: ServiceLeadGender;
}


export class BookLeadDTO {
  @IsString()
  serviceId!: string;

  @IsDateString()
  bookingDate!: string;

  @IsDateString()
  slotStartTime!: string;

  @IsOptional()
  @IsString()
  staffId?: string;
}

export class AssignStaffToLeadBookingDTO {
  @IsArray()
  @IsString({ each: true })
  staffIds!: string[];

  @IsDateString()
  slotStartTime!: string;

  @IsDateString()
  slotEndTime!: string;
}

export class RescheduleLeadBookingDTO {
  @IsDateString()
  bookingDate!: string;

  @IsDateString()
  slotStartTime!: string;

  @IsDateString()
  slotEndTime!: string;
}