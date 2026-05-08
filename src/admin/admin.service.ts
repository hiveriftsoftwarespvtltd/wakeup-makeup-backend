import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundError } from 'rxjs';
import { User, UserDocument } from 'src/user/schema/user.schema';
import { Vendor, VendorDocument } from 'src/vendor/schema/vendor.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async fetchAllVendors() {
    return await this.vendorModel.find().lean();
  }

  async fetchAllUsers() {
    return await this.userModel.find().select('-password').lean();
  }

  async fetchVendorDetails(vendorId: string) {
    const vendor = await this.vendorModel.findById(vendorId).lean();
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }
  async fetchUserDetails(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  async deleteUser(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await user.deleteOne();

    return {
      message: 'User deleted successfully',
    };
  }

  async deleteVendor(vendorId: string) {
    const vendor = await this.vendorModel.findById(vendorId);

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    await vendor.deleteOne();

    return {
      message: 'Vendor deleted successfully',
    };
  }

  async toggleActiveUser(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = !user.isActive;

    await user.save();

    return {
      message: `User ${
        user.isActive ? 'activated' : 'deactivated'
      } successfully`,
      user,
    };
  }

  async toggleActiveVendor(vendorId: string) {
    const vendor = await this.vendorModel.findById(vendorId);

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    vendor.isActive = !vendor.isActive;

    await vendor.save();

    return {
      message: `Vendor ${
        vendor.isActive ? 'activated' : 'deactivated'
      } successfully`,
      vendor,
    };
  }

  async fetchPendingVendors(){
    return await this.vendorModel.find({status:'PENDING'})
  }

  async acceptPendingVendor(vendorId:string){
    const vendor = await this.vendorModel.findById(vendorId)
    if(!vendor){
        throw new NotFoundException("Vendor not found")
    }

    if(vendor.status === "APPROVED"){
        throw new ConflictException("this vendor already approved")
    }

    vendor.status = "APPROVED"
    vendor.save()
    return vendor
  }

  async rejectPendingVendor(vendorId:string){
    const vendor = await this.vendorModel.findById(vendorId)
    if(!vendor){
        throw new NotFoundException("Vendor not found")
    }

    if(vendor.status === "REJECTED"){
        throw new ConflictException("this vendor is already rejected")
    }

    vendor.status = "REJECTED"
    vendor.save()
    return vendor
  }
}
