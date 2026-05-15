import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotFoundError } from 'rxjs';
import { ApiResponse } from 'src/common/responses/api-response';
import { DocumentService } from 'src/document/document.service';
import { Order, OrderDocument } from 'src/order/schema/order.schema';
import { Category, CategoryDocument } from 'src/product/schema/category.schema';
import {
  ProductVariant,
  ProductVariantDocument,
} from 'src/product/schema/product-variant.schema';
import { Product, ProductDocument } from 'src/product/schema/product.schema';
import { User, UserDocument, UserRole } from 'src/user/schema/user.schema';
import { Vendor, VendorDocument } from 'src/vendor/schema/vendor.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductVariant.name)
    private productVariantModel: Model<ProductVariantDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private documentService: DocumentService,
  ) {}

  async fetchAllVendors() {
    return await this.userModel
      .find({ role: UserRole.VENDOR })
      .populate('vendorId')
      .lean();
  }

  async fetchAllUsers() {
    return await this.userModel
      .find({ role: UserRole.USER })
      .select('-password')
      .lean();
  }

  async fetchVendorDetails(vendorId: string) {
    const vendor = await this.vendorModel.findById(vendorId).lean();

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const vendorProducts = await this.productModel.find({
      vendorId: new Types.ObjectId(vendorId),
      isDeleted: false,
    });

    const vendorCategories = await this.categoryModel.find({
      vendorId: new Types.ObjectId(vendorId),
      isDeleted: false,
    });

    return {
      vendor,
      vendorProducts,
      vendorCategories,
    };
  }

  async fetchUserDetails(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deleteUser(userId: string) {
  const user = await this.userModel
    .findById(userId)
    .select('-password');

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // delete avatar media if exists
  if (user.avatar) {
    try {
      await this.documentService.deleteMedia(
        user.avatar.toString(),
      );
    } catch (error:any) {
      console.log(
        'Failed to delete avatar media:',
        error.message,
      );
    }
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

    // Delete the user linked with this vendor
    await this.userModel.deleteOne({ vendorId: vendor._id });

    // Delete vendor
    await vendor.deleteOne();

    return {
      message: 'Vendor and linked user deleted successfully',
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

    const user = await this.userModel.findOne({ vendorId });
    if (!user) {
      throw new NotFoundException('User Not found');
    }

    vendor.isActive = !vendor.isActive;
    user.isActive = !user.isActive;
    user.isVendorOnboardingCompleted = false;

    await vendor.save();
    user.save();

    return {
      message: `Vendor ${
        vendor.isActive ? 'activated' : 'deactivated'
      } successfully`,
      vendor,
    };
  }

  async fetchPendingVendors() {
    return await this.vendorModel.find({ status: 'PENDING' });
  }

  async acceptPendingVendor(vendorId: string) {
    const vendor = await this.vendorModel.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.status === 'APPROVED') {
      throw new ConflictException('this vendor already approved');
    }

    // const user = await this.userModel.findOne({vendorId})
    // if(!user){
    //   throw new NotFoundException("User Not Exist")
    // }

    vendor.status = 'APPROVED';
    vendor.save();

    return vendor;
  }

  async rejectPendingVendor(vendorId: string) {
    const vendor = await this.vendorModel.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.status === 'REJECTED') {
      throw new ConflictException('this vendor is already rejected');
    }

    vendor.status = 'REJECTED';
    vendor.save();
    return vendor;
  }

  async deleteVendorProduct(vendorId: string, productId: string) {
    const vendor = await this.vendorModel.findById(vendorId);

    if (!vendor) {
      throw new NotFoundException('Vendor Not Found');
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // fetch all variants
    const variants = await this.productVariantModel.find({
      productId: product._id,
    });

    // delete media + variants
    for (const variant of variants) {
      // delete thumbnail
      if (variant.thumbnail) {
        await this.documentService.deleteMedia(variant.thumbnail.toString());
      }

      // delete images
      if (variant.images?.length) {
        for (const imageId of variant.images) {
          await this.documentService.deleteMedia(imageId.toString());
        }
      }

      // delete variant
      await variant.deleteOne();
    }

    // delete product
    await product.deleteOne();

    return ApiResponse.success('Product deleted successfully', null);
  }

  async fetchProducts() {
    const products = await this.productModel.find({});

    return ApiResponse.success('Products Fetched Successfully', products || []);
  }

  async fetchAllOrders() {
    return this.orderModel
      .find()
      .populate('userId',"-password")
      .populate('vendorId')
      .populate('addressId')
      .populate('items.productId')
      .populate('items.variantId')
      .sort({ createdAt: -1 })
      .lean();
  }

  async fetchOrderDetails(orderId:string){
    const order = await this.orderModel.findById(new Types.ObjectId(orderId)).populate('userId')
      .populate('vendorId')
      .populate('addressId')
      .populate('items.productId')
      .populate('items.variantId')
      .lean();
    if(!order){
      throw new NotFoundException("Order Not Found")
    }
    return ApiResponse.success("OrderDetails Fetched Successfully",order)
  }

  async deleteOrder(orderId:string){
    const order = await this.orderModel.findById(new Types.ObjectId(orderId))
    if(!order){
      throw new NotFoundException("Order not Found")
    }
    return ApiResponse.success("Order Deleted Successfully")
  }
}
