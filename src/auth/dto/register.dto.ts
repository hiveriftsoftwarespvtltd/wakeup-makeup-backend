import { IsEmail,IsString,MinLength,IsEnum,IsOptional,IsMongoId } from "class-validator";
import { UserRole } from "src/user/schema/user.schema";

export class RegisterDTO{
    @IsString()
    name!: string

    @IsEmail()
    email!: string

    @IsString()
    @MinLength(6)
    password!:string

    @IsEnum(UserRole)
    @IsOptional()
    role?:UserRole

    @IsMongoId()
    @IsOptional()
    tenantId!:string
}