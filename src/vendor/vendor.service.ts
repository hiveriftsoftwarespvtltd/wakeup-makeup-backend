import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Vendor, VendorDocument } from './schema/vendor.schema';
import { Model } from 'mongoose';
import { createVendorDTO } from './dto/create-vendor.dto';
import { User, UserDocument, UserRole } from 'src/user/schema/user.schema';
import { ApiResponse } from 'src/common/responses/api-response';

@Injectable()
export class VendorService {

    constructor(@InjectModel(Vendor.name) private vendorModel:Model<VendorDocument>, @InjectModel(User.name) private userModel:Model<UserDocument>){}

    async registerVendor(dto:createVendorDTO,userId:string){
          const isOwnerExist = await this.vendorModel.findOne({ownerId:userId})
          if(isOwnerExist){
            throw new BadRequestException("This Owner Already Exist with a Vendor")
          }

          const isUnique = await this.vendorModel.findOne({$or:[{businessName:dto.businessName.trim()},{slug:dto.slug.toLowerCase().trim()}]})

          if(isUnique){
            throw new ConflictException("Businessname or Slug already should be unique")
          }

          const user = await this.userModel.findById(userId)
          if(!user){
            throw new NotFoundException("User not found")
          }
          if(user.role !== UserRole.VENDOR){
            throw new BadRequestException("You need to register as vendor")
          }

          const vendor = await this.vendorModel.create({
            ownerId:userId,
            businessName:dto.businessName,
            slug:dto.slug.toLowerCase().trim()
          })

          user.vendorId = vendor._id
          await user.save()

          return ApiResponse.success("Vendor Request created successfully",vendor)
    }

    async getAllVendors(){
        return await this.vendorModel.find().lean()
    }

    async getVendorDetails(userId:string,vendorId:string){
        return await this.vendorModel.findOne({$and:[{ownerId:userId},{vendorId}]}).lean()
    }

    async updateVendorDetails(userId:string,vendorId:string){
      const vendor = await this.vendorModel.findOne({$and:[{ownerId:userId},{_id:vendorId}]}).lean()
      if(!vendor){
        throw new NotFoundException("Vendor Not found")
      }
    }
    
}
