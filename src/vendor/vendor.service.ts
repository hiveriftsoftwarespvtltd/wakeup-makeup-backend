import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Vendor, VendorDocument } from './schema/vendor.schema';
import { Model, Types } from 'mongoose';
import { createVendorDTO } from './dto/create-vendor.dto';
import { User, UserDocument, UserRole } from 'src/user/schema/user.schema';
import { ApiResponse } from 'src/common/responses/api-response';
import { DocumentService } from 'src/document/document.service';
import { updateVendorDTO } from './dto/update-vendor-dto';
import { Product, ProductDocument } from 'src/product/schema/product.schema';
import { Category, CategoryDocument } from 'src/product/schema/category.schema';
import { ProductVariant, ProductVariantDocument } from 'src/product/schema/product-variant.schema';
import { Order, OrderDocument, OrderStatus } from 'src/order/schema/order.schema';
import { UpdateOrderDTO } from './dto/order.dto';

@Injectable()
export class VendorService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
     @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(ProductVariant.name) private productVariantModel:Model<ProductVariantDocument>,
     @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private documentService: DocumentService,
  ) {}

  async registerVendor(
    dto: createVendorDTO,
    userId: string,
    files: { banner?: Express.Multer.File[]; logo?: Express.Multer.File[] },
  ) {
    const isOwnerExist = await this.vendorModel.findOne({ ownerId: userId });
    if (isOwnerExist) {
      throw new BadRequestException('This Owner Already Exist with a Vendor');
    }

    const isUnique = await this.vendorModel.findOne({
      $or: [
        { businessName: dto.businessName.trim() },
        { slug: dto.slug.toLowerCase().trim() },
      ],
    });

    if (isUnique) {
      throw new ConflictException(
        'Businessname or Slug already should be unique',
      );
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== UserRole.VENDOR) {
      throw new BadRequestException('You need to register as vendor');
    }

    const vendor = await this.vendorModel.create({
      ownerId: userId,
      businessName: dto.businessName,
      slug: dto.slug.toLowerCase().trim(),
    });

    let bannerImageId;
    let logoImageId;

    if (files?.banner?.length) {
      const uploadedBanner = await this.documentService.upload(
        files.banner[0],
        'vendor',
        userId,
        String(vendor._id),
      );
      bannerImageId = uploadedBanner._id;
    }
    if (files?.logo?.length) {
      const uploadedLogo = await this.documentService.upload(
        files.logo[0],
        'vendor',
        userId,
        String(vendor._id),
      );
      logoImageId = uploadedLogo._id;
    }

    vendor.logo = logoImageId;
    vendor.banner = bannerImageId;
    await vendor.save();

    user.vendorId = vendor._id;
    user.isVendorOnboardingCompleted = true;
    await user.save();

    return ApiResponse.success('Vendor Request created successfully', vendor);
  }

  async getAllVendors() {
    return await this.vendorModel.find().lean();
  }

  async getVendorDetails(userId: string, vendorId: string) {
    if(!vendorId){
      throw new ConflictException("Complete you onboarding to access this feature")
    }
    return await this.vendorModel.findById(vendorId).lean()
  }

  async updateVendorDetails(
    dto: updateVendorDTO,
    userId: string,
    vendorId: string,
    files: {
      banner?: Express.Multer.File[];
      logo?: Express.Multer.File[];
    },
  ) {
    
    const vendor = await this.vendorModel.findOne({
      ownerId: userId,
      _id: vendorId,
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (dto.businessName !== undefined && dto.businessName.trim() !== '') {
      const businessName = dto.businessName.trim();

      const existingBusiness = await this.vendorModel.findOne({
        businessName,
        _id: { $ne: vendorId },
      });

      if (existingBusiness) {
        throw new ConflictException('Business name already exists');
      }

      vendor.businessName = businessName;
    }

  
    if (dto.slug !== undefined && dto.slug.trim() !== '') {
      const slug = dto.slug.toLowerCase().trim();

    
      const existingSlug = await this.vendorModel.findOne({
        slug,
        _id: { $ne: vendorId },
      });

      if (existingSlug) {
        throw new ConflictException('Slug already exists');
      }

      vendor.slug = slug;
    }

    if (dto.description !== undefined && dto.description.trim() !== '') {
      vendor.description = dto.description.trim();
    }

    if (dto.address !== undefined && dto.address.trim() !== '') {
      vendor.address = dto.address.trim();
    }

    if (dto.phone !== undefined && dto.phone.trim() !== '') {
      vendor.phone = dto.phone.trim();
    }

 
    if (dto.email !== undefined && dto.email.trim() !== '') {
      vendor.email = dto.email.trim().toLowerCase();
    }

    if (files?.banner?.length) {

      if (vendor.banner) {
        await this.documentService.replace(
          String(vendor.banner),
          files.banner[0],
        );
      } else {
        /*
        CREATE NEW BANNER
      */
        const uploadedBanner = await this.documentService.upload(
          files.banner[0],
          'vendors/banner',
          userId,
          vendorId,
        );

        vendor.banner = uploadedBanner._id;
      }
    }

    
    if (files?.logo?.length) {
    
      if (vendor.logo) {
        await this.documentService.replace(String(vendor.logo), files.logo[0]);
      } else {
     
        const uploadedLogo = await this.documentService.upload(
          files.logo[0],
          'vendors/logo',
          userId,
          vendorId,
        );

        vendor.logo = uploadedLogo._id;
      }
    }

  
    await vendor.save();

    return ApiResponse.success('Vendor updated successfully', vendor);
  }

  async vendorProducts(userId:string,vendorId:string){
    if(!vendorId){
      throw new ConflictException("Complete Your Onboarding to access this feature")
    }
    return await this.productModel.find({createdBy:userId,vendorId:vendorId}).populate("variants").lean()
  }

  async vendorCategories(userId:string,vendorId:string){
    if(!vendorId){
      throw new ConflictException("Complete Your Onboarding to access this feature")
    }
    return await this.categoryModel.find({ownerId:userId,vendorId}).populate("image").lean()
  }

  async vendorOrders(vendorId:string){
    
    return this.orderModel.find({vendorId:new Types.ObjectId(vendorId)}).find()
      .populate('userId','-password')
      .populate('vendorId')
      .populate('addressId')
      .populate('items.productId')
      .populate('items.variantId')
      .sort({ createdAt: -1 })
      .lean();
  }

  async orderDetails(vendorId:string,orderId:string){
    const order = await this.orderModel.findOne({vendorId:new Types.ObjectId(vendorId),_id:new Types.ObjectId(orderId)}).populate('userId')
      .populate('vendorId')
      .populate('addressId')
      .populate('items.productId')
      .populate('items.variantId')
      .lean()

      if(!order){
        throw new NotFoundException("Order Not Found")
      }
      return ApiResponse.success("Order Details Fetched Successfully",order)
  }

  async updateOrder(dto:UpdateOrderDTO,orderId:string,vendorId:string){
    
    const order = await this.orderModel.findOne({_id:new Types.ObjectId(orderId),vendorId:new Types.ObjectId(vendorId)})
    if(!order){
      throw new NotFoundException("Order Not Found")
    }
    if(order.orderStatus === OrderStatus.DELIVERED){
      throw new ConflictException("You could not update delivered ordered")
    }
    const filteredData = Object.fromEntries(Object.entries(dto).filter(([_,value])=> value !== undefined && value !== null && value !== ''))
    Object.assign(order,filteredData)
    if(dto.orderStatus === "delivered" && dto.paymentStatus === "paid"){
      order.deliveredAt = new Date()
      order.vendorPaid = true
      order.vendorPaidAt = new Date()
      order.vendorPayoutAmount = order.subTotal
    }
    if(dto.orderStatus === 'cancelled'){
      if(!dto.cancellationReason){
        throw new ConflictException("Provide a reason to cancel this order")
      }
      const vendor = await this.vendorModel.findById(new Types.ObjectId(vendorId)).select("ownerId")
      if(!vendor){
        throw new NotFoundException("Vendor Not Found")
      }
      order.cancelledBy = vendor.ownerId
      order.cancellationReason = dto.cancellationReason
      order.cancelledAt=new Date()
    }
    await order.save()
    return ApiResponse.success("Order Update Successfully",order)
  }
}
