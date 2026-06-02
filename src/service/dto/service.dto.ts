import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";


export class CreateServiceCategoryDTO{

    @IsString()
    name!:string

    @IsString()
    label!:string

    @IsString()
    description!:string;

    @IsOptional()
    @IsBoolean()
    isActive?:boolean
}

export class UpdateServiceCategoryDTO extends CreateServiceCategoryDTO{}

export class CreateServiceSubscriptionPlanDTO{
    @IsString()
    name!:string

    @IsString()
    label!:string

    @IsNumber()
    durationDays!:number

    @IsNumber()
    price!:number

    @IsNumber()
    maxService!:number

    @IsNumber()
    maxStaff!:number

    @IsNumber()
    monthlyLeadLimit!:number

    @IsNumber()
    commissionPercentage!:number

    @IsBoolean()
    featuredListing!:boolean

    @IsBoolean()
    prioritySupport!:boolean

    @IsBoolean()
    analyticsAccess!:boolean

    @IsOptional()
    @IsBoolean()
    isActive?:boolean


    @IsNumber()
    priorityRank!:number

}

export class UpdateServiceSubscriptionPlanDTO extends CreateServiceSubscriptionPlanDTO{}