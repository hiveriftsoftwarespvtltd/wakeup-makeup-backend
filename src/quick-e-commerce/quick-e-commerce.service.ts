import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument, ProductStatus } from 'src/product/schema/product.schema';
import { ProductVariant, ProductVariantDocument } from 'src/product/schema/product-variant.schema';
import { Vendor, VendorDocument } from 'src/vendor/schema/vendor.schema';
import { Address, AddressDocument } from 'src/address/schema/address.schema';
import { QuickECommerceQueryDto } from './dto/quick-e-commerce-query.dto';

@Injectable()
export class QuickECommerceService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductVariant.name) private productVariantModel: Model<ProductVariantDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
  ) { }

  async getProducts(query: QuickECommerceQueryDto, user: any) {
    const { page = 1, limit = 10, search, category, minPrice, maxPrice, addressId } = query;
    const skip = (page - 1) * limit;

    const matchStage: any = {
      isActive: true,
      isDeleted: false,
      status: ProductStatus.ACTIVE,
    };

    if (user && addressId) {
      const address = await this.addressModel.findOne({
        _id: new Types.ObjectId(addressId),
        user: new Types.ObjectId(user._id),
      });

      if (!address) {
        throw new BadRequestException('Address not found or does not belong to the user');
      }

      console.log("User Pincode", address.pincode)

      const vendors = await this.vendorModel.find({
        vendorPincode: address.pincode,
        isActive: true,
        isDeleted: false,
      });

      console.log("Vendor IDs", vendors)

      const vendorIds = vendors.map(v => v._id);
      matchStage.vendorId = { $in: vendorIds };
    }

    if (category) {
      matchStage.categoryId = new Types.ObjectId(category);
    }

    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceQuery: any = { isActive: true, isDeleted: false };
      const priceMatch: any = {};
      if (minPrice !== undefined) priceMatch.$gte = minPrice;
      if (maxPrice !== undefined) priceMatch.$lte = maxPrice;
      priceQuery.offeredPrice = priceMatch;

      const matchingVariants = await this.productVariantModel.find(priceQuery).select('productId');
      const matchingProductIds = matchingVariants.map(v => v.productId);

      matchStage._id = { $in: matchingProductIds };
    }

    console.log("Match Stage--->", matchStage)

    const [products, total] = await Promise.all([
      this.productModel
        .find(matchStage)
        .populate({
          path: 'variants',
          populate: [
            { path: 'thumbnail', select: 'url publicId type originalName' },
            { path: 'images', select: 'url publicId type originalName' },
          ],
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.productModel.countDocuments(matchStage).exec(),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

