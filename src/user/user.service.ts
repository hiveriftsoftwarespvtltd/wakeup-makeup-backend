import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel:Model<UserDocument>){}

    async create(dto:CreateUserDto){
        return this.userModel.create(dto)
    }

    async findAll(){
        return this.userModel.find().select("-password")
    }

    async findById(id:string){
        const user = await this.userModel.findById(id).select("-password")
        if(!user){
            throw new NotFoundException("User not found")
        }
        return user
    }

    async findByEmail(email:string){
        const user = await this.userModel.findOne({email})
        return user
    }

    async updateUser(id:string,dto:UpdateUserDto){
        const user = await this.userModel.findByIdAndUpdate(id,dto,{new:true}).select("-password")
        if(!user){
            throw new NotFoundException("User not found")
        }
        return user
    }

    async removeUser(id:string){
        const user = await this.userModel.findByIdAndDelete(id)
        if(!user){
            throw new NotFoundException("User not found")
        }

        return {message:"User deleted successfully"}
    }
}
