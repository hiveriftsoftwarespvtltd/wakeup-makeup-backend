import { Type } from "class-transformer";
import { ArrayUnique, IsArray, IsBoolean, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { CourseLanguage, CourseLevel, CourseStatus } from "../schema/course.schema";


export class AddCourseCategoryDTO {
    @IsString()
    name!: string


    @IsString()
    description!: string

    @IsString()
    label!: string

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsString({ each: true })
    tags?: string[]

}

export class UpdateCourseCategoryDTO {

    @IsOptional()
    @IsString()
    name: string


    @IsOptional()
    @IsString()
    description?: string

    @IsOptional()
    @IsString()
    label?: string

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsString({ each: true })
    tags?: string[]

    @IsOptional()
    @IsBoolean()
    isActive?: boolean
}

export class CreateCourseDTO {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    subtitle?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsMongoId()
    categoryId: string;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsString({ each: true })
    tags?: string[];

    @IsEnum(CourseLevel)
    level?: CourseLevel;

    @IsOptional()
    @IsEnum(CourseLanguage)
    language?: CourseLanguage;


    @Type(() => Number)
    @IsNumber()
    @Min(0)
    costPrice: number;


    @Type(() => Number)
    @IsNumber()
    @Min(0)
    sellingPrice: number;


    @Type(() => Number)
    @Min(0)
    offeredPrice: number;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isFree?: boolean;
}

export class UpdateCourseDTO {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    subtitle?: string;

    @IsOptional()
    @IsString()
    description?: string;

    // @IsMongoId()
    // thumbnail: string;

    @IsMongoId()
    categoryId: string;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsEnum(CourseLevel)
    level?: CourseLevel;

    @IsOptional()
    @IsEnum(CourseLanguage)
    language?: CourseLanguage;

    @IsOptional()
    @IsEnum(CourseStatus)
    status?: CourseStatus;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    costPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    sellingPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @Min(0)
    offeredPrice?: number;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isFree?: boolean;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean
}