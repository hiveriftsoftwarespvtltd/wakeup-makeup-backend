import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs'
import { InjectModel } from '@nestjs/mongoose';
import { User, UserRole } from 'src/user/schema/user.schema';
import { Model } from 'mongoose';
import { RegisterDTO } from './dto/register.dto';
import { ApiResponse } from 'src/common/responses/api-response';
import { LoginDTO } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(@InjectModel(User.name) private userModel:Model<User>, private userService:UserService,private jwtService:JwtService){}

    async register(dto:RegisterDTO){
        const existingUser = await this.userModel.findOne({email:dto.email})
        if(existingUser){
            throw new BadRequestException('email already exist')
        }
        if(dto.role === UserRole.ADMIN){
            throw new BadRequestException("You are not authorized to create admin account")
        }
        if(dto.role === UserRole.VENDOR && !dto.tenantId){
            throw new BadRequestException("tenantId is required")
        }
        const hashedPassword = await bcrypt.hash(dto.password,10)

        const user = await this.userService.create({...dto,password:hashedPassword})

        const {password,...safeUser} = user.toObject()

        return  ApiResponse.success('User Registered Successfully', safeUser, 201)
    }

    async login(dto:LoginDTO){
        const user = await this.userModel.findOne({email:dto.email})
        if(!user){
            throw new UnauthorizedException("Invalid Exception")
        }

        if(!user.password){
             throw new UnauthorizedException("Login with Google")
        }

        const isMatch = await bcrypt.compare(dto.password,user.password)
        if(!isMatch){
            throw new UnauthorizedException("Invalid Credentials")
        }

        const {password,...safeUser} = user.toObject()

        const payload = {
            id:user._id,
            email:user.email,
            role:user.role,
        }

        const token = await this.jwtService.signAsync(payload)

        return ApiResponse.success("User Login Successfuly",{safeUser,access_token:token},200)

        
    }
}
