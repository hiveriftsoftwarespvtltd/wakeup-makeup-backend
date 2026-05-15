import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsMongoId, IsOptional, IsString, ValidateNested } from "class-validator";


class categoryAttributeDTO{
    @IsString()
    name!:string

    @IsBoolean()
    isVariant!:boolean

    @IsArray()
    @IsString({each:true})
    values!:string[]
}
export class CreateCategory{
    
    @IsString()
    name!:string;

    @IsOptional()
    @IsString()
    slug?:string;

    @IsOptional()
    @IsString()
    description?:string;

    // @IsOptional()
    // @IsArray()
    // @ValidateNested({each:true})
    // @Type(()=>categoryAttributeDTO)
    // attributes?:categoryAttributeDTO[]

    @IsOptional()
    @IsMongoId()
    image?:string
}