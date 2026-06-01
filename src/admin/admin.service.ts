import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { NotFoundError } from 'rxjs';
import { ApiResponse } from 'src/common/responses/api-response';
import { DocumentService } from 'src/document/document.service';
import {
  Order,
  OrderDocument,
  OrderStatus,
  // PaymentMethod,
  PaymentStatus,
} from 'src/order/schema/order.schema';
import { Category, CategoryDocument } from 'src/product/schema/category.schema';
import {
  ProductVariant,
  ProductVariantDocument,
} from 'src/product/schema/product-variant.schema';
import { Product, ProductDocument } from 'src/product/schema/product.schema';
import { User, UserDocument, UserRole } from 'src/user/schema/user.schema';
import {
  Vendor,
  VendorDocument,
  VendorSchema,
} from 'src/vendor/schema/vendor.schema';
import {
  UpdateVendorDTO,
  updateVendorPayoutDTO,
  vendorPayDTO,
} from './dto/vendor.dto';
// import { CreateCategory } from 'src/product/dto/create-category.dto';
import { CreateCategoryDTO, UpdateCategoryDTO } from './dto/category.dto';
import { Connection } from 'mongoose';
import {
  VendorOrder,
  VendorOrderDocument,
} from 'src/order/schema/vendor-order.schema';
import {
  InfluencerCommission,
  InfluencerCommissionDocument,
} from 'src/influencer/schema/influencer-commision-rate.schema';
import {
  PaymentMethod,
  VendorPayout,
  VendorPayoutDocument,
  VendorPayoutStatus,
} from 'src/vendor/schema/vendor-payout.schema';
import {
  InfluencerCommissionSlabDocument,
  influencerCommissonSlab,
} from 'src/influencer/schema/influencer-commission-slab';
import { Influencer, InfluencerDocument } from 'src/influencer/schema/influencer.schema';
import { InfluencerPayout, InfluencerPayoutDocument } from 'src/influencer/schema/influencer-payout.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductVariant.name)
    private productVariantModel: Model<ProductVariantDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,

    @InjectConnection()
    private readonly connection: Connection,

    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private documentService: DocumentService,

    @InjectModel(VendorOrder.name)
    private vendorOrderModel: Model<VendorOrderDocument>,
    @InjectModel(InfluencerCommission.name)
    private influencerCommisionModel: Model<InfluencerCommissionDocument>,
    @InjectModel(VendorPayout.name)
    private vendorPayoutModel: Model<VendorPayoutDocument>,
    @InjectModel(influencerCommissonSlab.name)
    private influencerCommissionSlabModel: Model<InfluencerCommissionSlabDocument>,
    @InjectModel(Influencer.name) private influencerModel:Model<InfluencerDocument>,
    @InjectModel(InfluencerPayout.name) private influencerPayoutModel:Model<InfluencerPayoutDocument>
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
    const vendor = await this.vendorModel
      .findById(vendorId)
      .populate('ownerId', '-password -otpExpiresAt -otp')
      .lean();

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const vendorProducts = await this.productModel.find({
      vendorId: new Types.ObjectId(vendorId),
      isDeleted: false,
    });

    // const vendorCategories = await this.categoryModel.find({
    //   vendorId: new Types.ObjectId(vendorId),
    //   isDeleted: false,
    // });

    return {
      vendor,
      vendorProducts,
      // vendorCategories,
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
    const user = await this.userModel.findById(userId).select('-password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // delete avatar media if exists
    if (user.avatar) {
      try {
        await this.documentService.deleteMedia(user.avatar.toString());
      } catch (error: any) {
        console.log('Failed to delete avatar media:', error.message);
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

  // async toggleActiveVendor(vendorId: string) {
  //   const vendor = await this.vendorModel.findById(vendorId);

  //   if (!vendor) {
  //     throw new NotFoundException('Vendor not found');
  //   }

  //   const user = await this.userModel.findOne({ vendorId:new Types.ObjectId(vendor) });
  //   if (!user) {
  //     throw new NotFoundException('User Not found');
  //   }

  //   vendor.isActive = !vendor.isActive;
  //   user.isActive = !user.isActive;
  //   user.isVendorOnboardingCompleted = false;

  //   await vendor.save();
  //   user.save();

  //   return {
  //     message: `Vendor ${
  //       vendor.isActive ? 'activated' : 'deactivated'
  //     } successfully`,
  //     vendor,
  //   };
  // }

  async toggleActiveVendor(vendorId: string) {
    const vendor = await this.vendorModel.findById(vendorId);

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const newStatus = !vendor.isActive;

    await this.vendorModel.updateOne(
      { _id: vendorId },
      { $set: { isActive: newStatus } },
    );

    await this.userModel.updateOne(
      { vendorId: new Types.ObjectId(vendorId) },
      {
        $set: {
          isActive: newStatus,
          isVendorOnboardingCompleted: false,
        },
      },
    );

    return {
      message: `Vendor ${newStatus ? 'activated' : 'deactivated'} successfully`,
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

  // async fetchAllOrders() {
  //   return this.orderModel
  //     .find()
  //     .populate('userId', '-password')
  //     .populate('vendorId')
  //     .populate('addressId')
  //     .populate('items.productId')
  //     .populate('items.variantId')
  //     .sort({ createdAt: -1 })
  //     .lean();
  // }

  // async fetchOrderDetails(orderId: string) {
  //   const order = await this.orderModel
  //     .findById(new Types.ObjectId(orderId))
  //     .populate('userId')
  //     // .populate('vendorId')
  //     // .populate('addressId')
  //     .populate('items.productId')
  //     .populate('items.variantId')
  //     .lean();
  //   if (!order) {
  //     throw new NotFoundException('Order Not Found');
  //   }
  //   return ApiResponse.success('OrderDetails Fetched Successfully', order);
  // }

  // async deleteOrder(orderId: string) {
  //   const order = await this.orderModel.findById(new Types.ObjectId(orderId));
  //   if (!order) {
  //     throw new NotFoundException('Order not Found');
  //   }
  //   return ApiResponse.success('Order Deleted Successfully');
  // }

  async fetchAllOrders() {
    const orders = await this.orderModel
      .find({ isDeleted: false })
      .populate('userId', '-password')
      .populate({
        path: 'vendorOrders',
        populate: [
          {
            path: 'vendorId',
            select: '-password',
          },
          {
            path: 'items.productId',
          },
          {
            path: 'items.variantId',
          },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success('Orders Fetched Successfully', orders);
  }

  async fetchOrderDetails(orderId: string) {
    const order = await this.orderModel
      .findOne({
        _id: new Types.ObjectId(orderId),
        isDeleted: false,
      })
      .populate('userId', '-password')
      .populate({
        path: 'vendorOrders',
        populate: [
          {
            path: 'vendorId',
            select: '-password',
          },
          {
            path: 'items.productId',
          },
          {
            path: 'items.variantId',
          },
        ],
      })
      .lean();

    if (!order) {
      throw new NotFoundException('Order Not Found');
    }

    return ApiResponse.success('Order Details Fetched Successfully', order);
  }

  async deleteOrder(orderId: string) {
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      isDeleted: false,
    });

    if (!order) {
      throw new NotFoundException('Order Not Found');
    }

    await this.orderModel.updateOne(
      { _id: order._id },
      {
        $set: {
          isDeleted: true,
        },
      },
    );

    return ApiResponse.success('Order Deleted Successfully');
  }

  async updateVendorDetails(dto: UpdateVendorDTO, vendorId: string) {
   
    const filteredObject = Object.fromEntries(
      Object.entries(dto).filter(
        ([_, value]) =>
          value !== undefined &&
          value !== null &&
          !(typeof value === 'string' && value.trim() === ''),
      ),
    );

    const vendor = await this.vendorModel.findByIdAndUpdate(
      new Types.ObjectId(vendorId),
      { $set: filteredObject },
      { new: true, runValidators: true },
    );

    if (!vendor) {
      throw new NotFoundException('Vendor Not Found');
    }

    return ApiResponse.success('Vendor Updated Successfully', vendor);
  }

  async adminDeleteCategory(categoryId: string) {
    const category = await this.categoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const products = await this.productModel.find({
      categoryId: category._id,
    });

    if (products.length) {
      throw new BadRequestException('Cannot delete category with products');
    }

    if (category.image) {
      await this.documentService.deleteMedia(category.image.toString());
    }

    await category.deleteOne();

    return ApiResponse.success('Category deleted successfully');
  }

  async deleteAllProducts() {
    const session = await this.productModel.db.startSession();

    try {
      session.startTransaction();

      const products = await this.productModel.find({}).session(session);

      const productIds = products.map((product) => product._id);

      const variants = await this.productVariantModel
        .find({
          productId: { $in: productIds },
        })
        .session(session);

      const mediaIds: string[] = [];

      for (const variant of variants) {
        if (variant.thumbnail) {
          mediaIds.push(variant.thumbnail.toString());
        }

        if (variant.images?.length) {
          mediaIds.push(...variant.images.map((img) => img.toString()));
        }
      }

      await this.productVariantModel.deleteMany({}, { session });

      await this.productModel.deleteMany({}, { session });

      await session.commitTransaction();

      await Promise.allSettled(
        mediaIds.map((id) => this.documentService.deleteMedia(id)),
      );

      return ApiResponse.success('All products deleted successfully');
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async deleteAllCategories() {
    const session = await this.categoryModel.db.startSession();

    try {
      session.startTransaction();

      const categories = await this.categoryModel
        .find(
          {},
          {
            _id: 1,
            image: 1,
          },
        )
        .lean()
        .session(session);

      if (!categories.length) {
        throw new NotFoundException('No categories found');
      }

      const mediaIds: string[] = [];

      for (const category of categories) {
        if (category.image) {
          mediaIds.push(category.image.toString());
        }
      }

      await this.categoryModel.deleteMany({}, { session });

      await session.commitTransaction();

      // Delete media only after successful commit
      await Promise.allSettled(
        mediaIds.map((id) => this.documentService.deleteMedia(id)),
      );

      return ApiResponse.success('All categories deleted successfully');
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async createCategory(
    dto: CreateCategoryDTO,
    file: Express.Multer.File,
    userId: string,
  ) {
    const existingCategory = await this.categoryModel.findOne({
      isDeleted: false,
      $or: [
        { name: dto.name.toLowerCase() },
        { slug: dto.slug.toLowerCase() },
        { label: dto.label },
      ],
    });

    if (existingCategory) {
      throw new ConflictException(
        'Category with same name, label or slug already exists',
      );
    }

    let mediaId: Types.ObjectId | undefined;

    if (file) {
      const uploaded = await this.documentService.upload(
        file,
        'category',
        userId,
      );

      mediaId = uploaded._id;
    }

    const category = await this.categoryModel.create({
      name: dto.name.toLowerCase(),
      slug: dto.slug.toLowerCase(),
      description: dto.description,
      label: dto.label,
      tags: dto.tags ?? [],
      image: mediaId,
    });

    return ApiResponse.success('Category Created Successfully', category);
  }

  async updateCategory(
    dto: UpdateCategoryDTO,
    file: Express.Multer.File,
    userId: string,
    categoryId: string,
  ) {
    const category = await this.categoryModel.findOne({
      _id: categoryId,
      isDeleted: false,
    });

    if (!category) {
      throw new NotFoundException('Category Not Found');
    }

    if (dto.name || dto.slug) {
      const existingCategory = await this.categoryModel.findOne({
        _id: { $ne: categoryId },
        isDeleted: false,
        $or: [
          ...(dto.name ? [{ name: dto.name.toLowerCase() }] : []),

          ...(dto.slug ? [{ slug: dto.slug.toLowerCase() }] : []),
          ...(dto.label ? [{ label: dto.label }] : []),
        ],
      });

      if (existingCategory) {
        throw new ConflictException(
          'Category with same name,label or slug already exists',
        );
      }
    }

    if (file) {
      if (category.image) {
        await this.documentService.deleteMedia(category.image.toString());
      }

      const uploaded = await this.documentService.upload(
        file,
        'category',
        userId,
      );

      category.image = uploaded._id;
    }

    if (dto.name !== undefined && dto.name.trim() !== '') {
      // const isNameExist = await this.categoryModel.findOne({name:dto.name,_id:{$ne:categoryId}})
      // if(isNameExist){
      //   throw new BadRequestException("This Category name already exist")
      // }
      category.name = dto.name.toLowerCase();
    }

    if (dto.slug !== undefined && dto.slug.trim() !== '') {
      category.slug = dto.slug.toLowerCase();
    }

    if (dto.description !== undefined) {
      category.description = dto.description;
    }

    if (dto.label !== undefined) {
      category.label = dto.label;
    }

    if (dto.tags !== undefined) {
      category.tags = dto.tags.map((tag) => tag.toLowerCase().trim());
    }

    await category.save();

    return ApiResponse.success('Category Updated Successfully', category);
  }

  async fetchAllCategories() {
    const categories = await this.categoryModel
      .find({ isActive: true, isDeleted: false })
      .populate('image', 'url')
      .lean();
    return ApiResponse.success('Fetch all categories', categories);
  }

  async deleteCategory(categoryId: string) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const category = await this.categoryModel.findOne(
        {
          _id: new Types.ObjectId(categoryId),
        },
        null,
        { session },
      );

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const productExists = await this.productModel.exists({
        categoryId: category._id,
        isDeleted: false,
      });

      // Products are using this category
      if (productExists) {
        category.isDeleted = true;

        await category.save({ session });

        await session.commitTransaction();

        return ApiResponse.success(
          'Category marked as deleted because products are associated with it',
          category,
        );
      }

      // No products => hard delete

      if (category.image) {
        await this.documentService.deleteMedia(category.image.toString());
      }

      await this.categoryModel.deleteOne(
        {
          _id: category._id,
        },
        { session },
      );

      await session.commitTransaction();

      return ApiResponse.success('Category deleted successfully', null);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async fetchCategoryDetails(categoryId: string) {
    const category = await this.categoryModel
      .findById(new Types.ObjectId(categoryId))
      .populate('image', 'url');
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return ApiResponse.success(
      'Category details fetched successfully!',
      category,
    );
  }

  async vendorPayoutDetails(
    vendorId: string,
    limit = 10,
    page = 1,
    status?: string,
    month?: number,
    year?: number,
  ) {
    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const skip = (page - 1) * limit;

    const now = new Date();

    month = month || now.getMonth() + 1;
    year = year || now.getFullYear();

    const startDate = new Date(year, month - 1, 1);

    const endDate = new Date(year, month, 0);

    endDate.setHours(23, 59, 59, 999);

    const match: any = {
      vendorId: new Types.ObjectId(vendorId),

      orderStatus: OrderStatus.DELIVERED,

      deliveredAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (status === 'pending') {
      match.isVendorSettled = false;
    }

    if (status === 'paid') {
      match.isVendorSettled = true;
    }

    const vendor = await this.vendorModel.findById(vendorId);

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const summary = await this.vendorOrderModel.aggregate([
      {
        $match: match,
      },

      {
        $group: {
          _id: null,

          totalOrders: {
            $sum: 1,
          },

          totalSales: {
            $sum: '$grandTotal',
          },

          totalPlatformCommission: {
            $sum: '$commissionAmount',
          },

          totalInfluencerCommission: {
            $sum: '$influencerCommissionAmount',
          },

          totalGrossProfit: {
            $sum: '$grossProfit',
          },

          totalNetProfit: {
            $sum: '$netProfit',
          },

          totalVendorPayout: {
            $sum: '$payoutAmount',
          },
        },
      },
    ]);

    const total = await this.vendorOrderModel.countDocuments(match);

    const orders = await this.vendorOrderModel
      .find(match)
      .populate('userId', 'name email phone')
      .sort({
        deliveredAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean();

    return ApiResponse.success('Vendor payout details fetched', {
      vendor: {
        _id: vendor._id,
        businessName: vendor.businessName,
      },

      filters: {
        month,
        year,
        status: status || 'all',
      },

      summary: summary[0] || {},

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },

      orders,
    });
  }

  // async payVendorPayouts(
  //   adminId: string,
  //   vendorId: string,
  //   dto: vendorPayDTO,
  //   // payoutIds: string[],
  //   // paymentReference?: string,
  //   // transactionId?: string,
  //   // notes?: string,
  // ) {
  //   const { payoutIds, paymentReference, transactionId, notes, paymentMethod } =
  //     dto;
  //   const session = await this.connection.startSession();

  //   try {
  //     session.startTransaction();

  //     // validate vendor
  //     const vendor = await this.vendorModel
  //       .findById(new Types.ObjectId(vendorId))
  //       .session(session);

  //     if (!vendor) {
  //       throw new NotFoundException('Vendor not found');
  //     }

  //     // fetch payouts
  //     const payouts = await this.vendorPayoutModel
  //       .find({
  //         _id: {
  //           $in: payoutIds.map((id) => new Types.ObjectId(id)),
  //         },

  //         vendorId: new Types.ObjectId(vendorId),
  //       })
  //       .populate('vendorOrderId', 'orderNumber orderStatus grandTotal')
  //       .session(session);

  //     if (!payouts.length) {
  //       throw new NotFoundException('No payouts found');
  //     }

  //     // validate payouts
  //     for (const payout of payouts) {
  //       // already paid

  //       if (payout.status === VendorPayoutStatus.PAID) {
  //         throw new BadRequestException(
  //           `Order payout already paid for order ${(payout.vendorOrderId as any)?.orderNumber}`,
  //         );
  //       }

  //       // cancelled
  //       if (payout.status === VendorPayoutStatus.CANCELLED) {
  //         throw new BadRequestException(
  //           `Cancelled payout cannot be paid for order ${(payout.vendorOrderId as any)?.orderNumber}`,
  //         );
  //       }

  //       // reversed
  //       if (payout.status === VendorPayoutStatus.REVERSED) {
  //         throw new BadRequestException(
  //           `Reversed payout cannot be paid for order ${(payout.vendorOrderId as any)?.orderNumber}`,
  //         );
  //       }

  //       // only approved
  //       if (payout.status !== VendorPayoutStatus.APPROVED) {
  //         throw new BadRequestException(
  //           `Only approved payouts can be paid for order ${(payout.vendorOrderId as any)?.orderNumber}`,
  //         );
  //       }
  //     }

  //     // calculate total amount
  //     const totalAmount = payouts.reduce(
  //       (acc, item) => acc + item.payoutAmount,
  //       0,
  //     );

  //     // update payouts
  //     for (const payout of payouts) {
  //       payout.status = VendorPayoutStatus.PAID;

  //       payout.isSettled = true;

  //       payout.paidAt = new Date();

  //       payout.settledAt = new Date();

  //       payout.paymentReference = paymentReference;

  //       payout.transactionId = transactionId;
  //       payout.paymentMethod = paymentMethod ?? PaymentMethod.BANK_TRANSFER;

  //       payout.notes = notes;
  //       payout.paidBy = new Types.ObjectId(adminId);

  //       await payout.save({
  //         session,
  //       });
  //     }

  //     await session.commitTransaction();

  //     return ApiResponse.success('Vendor payouts paid successfully', {
  //       vendor: {
  //         _id: vendor._id,
  //         businessName: vendor.businessName,
  //       },

  //       totalOrders: payouts.length,

  //       totalAmount,

  //       paymentReference,

  //       transactionId,

  //       payouts: payouts.map((item) => ({
  //         payoutId: item._id,

  //         orderId: item.orderId,

  //         vendorOrderId: item.vendorOrderId,

  //         payoutAmount: item.payoutAmount,

  //         status: item.status,
  //       })),
  //     });
  //   } catch (error) {
  //     await session.abortTransaction();

  //     throw error;
  //   } finally {
  //     session.endSession();
  //   }
  // }

  async updateVendorPayoutStatus(vendorId: string, dto: updateVendorPayoutDTO) {
    const vendor = await this.vendorModel.findById(
      new Types.ObjectId(vendorId),
    );

    if (!vendor) {
      throw new NotFoundException('Vendor Not Found');
    }

    const vendorPayout = await this.vendorPayoutModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(dto.vendorPayoutId),

        vendorId: new Types.ObjectId(vendorId),
      },

      {
        $set: {
          status: dto.status,
        },
      },

      {
        new: true,
      },
    );

    if (!vendorPayout) {
      throw new NotFoundException('Vendor payout not found');
    }

    return ApiResponse.success(
      'Vendor payout status updated successfully',
      vendorPayout,
    );
  }

  async allInfluencerCommission(
    limit = 10,
    page = 1,
    status?: string,
    month?: number,
    year?: number,
  ) {
    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const skip = (page - 1) * limit;

    // Default current month/year
    const currentDate = new Date();

    if (!month) {
      month = currentDate.getMonth() + 1;
    }

    if (!year) {
      year = currentDate.getFullYear();
    }

    const match: any = {
      isDelivered: true,
      commissionMonth: month,
      commissionYear: year,
    };

    if (status?.toLowerCase() === 'pending') {
      match.isSettled = false;
    }

    if (status?.toLowerCase() === 'paid') {
      match.isSettled = true;
    }

    const pipeline: any = [
      {
        $match: match,
      },

      {
        $group: {
          _id: '$influencerId',

          influencerUserId: {
            $first: '$influencerUserId',
          },

          totalOrders: {
            $sum: 1,
          },

          totalSales: {
            $sum: '$finalOrderAmount',
          },

          totalProfit: {
            $sum: '$platformCommissionAmount',
          },

          earnedCommission: {
            $sum: '$commissionAmount',
          },

          settledCount: {
            $sum: {
              $cond: ['$isSettled', 1, 0],
            },
          },

          unsettledCount: {
            $sum: {
              $cond: ['$isSettled', 0, 1],
            },
          },

          commissionIds: {
            $push: '$_id',
          },
        },
      },

      {
        $lookup: {
          from: 'influencers',
          localField: '_id',
          foreignField: '_id',
          as: 'influencer',
        },
      },

      {
        $unwind: {
          path: '$influencer',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          influencerId: '$_id',

          influencerName: '$influencer.name',

          influencerUserId: 1,

          totalOrders: 1,

          totalSales: 1,

          totalProfit: 1,

          earnedCommission: 1,

          settledCount: 1,

          unsettledCount: 1,

          commissionIds: 1,
        },
      },

      {
        $sort: {
          totalSales: -1,
        },
      },
    ];

    const aggregatedData =
      await this.influencerCommisionModel.aggregate(pipeline);

    const slabs = await this.influencerCommissionSlabModel
      .find({
        isActive: true,
      })
      .sort({
        minSales: 1,
      })
      .lean();

    const transformedData = aggregatedData.map((item) => {
      const slab = slabs.find(
        (s) => item.totalSales >= s.minSales && item.totalSales <= s.maxSales,
      );

      const commissionRate = slab?.commissionRate || 0;

      const calculatedPayout = Number(
        ((item.totalPlatformCommission * commissionRate) / 100).toFixed(2),
      );

      return {
        influencerId: item.influencerId,

        influencerName: item.influencerName || '',

        totalOrders: item.totalOrders,

        totalSales: item.totalSales,

        totalProfit: item.totalProfit,

        earnedCommission: item.earnedCommission,

        commissionRate,

        calculatedPayout,

        slab: slab
          ? {
              minSales: slab.minSales,
              maxSales: slab.maxSales,
              commissionRate: slab.commissionRate,
            }
          : null,

        settledCount: item.settledCount,

        unsettledCount: item.unsettledCount,

        payoutStatus: item.unsettledCount > 0 ? 'pending' : 'paid',
      };
    });

    const total = transformedData.length;

    const paginatedData = transformedData.slice(skip, skip + limit);

    return ApiResponse.success('Influencer commissions fetched successfully', {
      filters: {
        month,
        year,
        status: status || 'all',
      },

      summary: {
        totalInfluencers: total,

        totalSales: transformedData.reduce(
          (sum, item) => sum + item.totalSales,
          0,
        ),

        totalProfit: transformedData.reduce(
          (sum, item) => sum + item.totalProfit,
          0,
        ),

        totalPayout: transformedData.reduce(
          (sum, item) => sum + item.calculatedPayout,
          0,
        ),
      },

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },

      data: paginatedData,
    });
  }

  async allVendorPayouts(
    limit = 10,
    page = 1,
    status?: string,
    month?: number,
    year?: number,
  ) {
    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const skip = (page - 1) * limit;

    const now = new Date();

    month = month || now.getMonth() + 1;
    year = year || now.getFullYear();

    const startDate = new Date(year, month - 1, 1);

    const endDate = new Date(year, month, 0);

    endDate.setHours(23, 59, 59, 999);

    const match: any = {
      orderStatus: OrderStatus.DELIVERED,

      deliveredAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (status === 'pending') {
      match.isVendorSettled = false;
    }

    if (status === 'paid') {
      match.isVendorSettled = true;
    }

    const summary = await this.vendorOrderModel.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: null,

          totalOrders: {
            $sum: 1,
          },

          totalSales: {
            $sum: '$grandTotal',
          },

          totalPlatformCommission: {
            $sum: '$commissionAmount',
          },

          totalInfluencerCommission: {
            $sum: '$influencerCommissionAmount',
          },

          totalGrossProfit: {
            $sum: '$grossProfit',
          },

          totalNetProfit: {
            $sum: '$netProfit',
          },

          totalVendorPayout: {
            $sum: '$payoutAmount',
          },
        },
      },
    ]);

    const vendorPipeline: any = [
      {
        $match: match,
      },

      {
        $group: {
          _id: '$vendorId',

          totalOrders: {
            $sum: 1,
          },

          totalSales: {
            $sum: '$grandTotal',
          },

          totalPlatformCommission: {
            $sum: '$commissionAmount',
          },

          // totalInfluencerCommission: {
          //   $sum:
          //     '$influencerCommissionAmount',
          // },

          totalGrossProfit: {
            $sum: '$grossProfit',
          },

          totalNetProfit: {
            $sum: '$netProfit',
          },

          totalVendorPayout: {
            $sum: '$payoutAmount',
          },

          settledOrders: {
            $sum: {
              $cond: ['$isVendorSettled', 1, 0],
            },
          },

          unsettledOrders: {
            $sum: {
              $cond: ['$isVendorSettled', 0, 1],
            },
          },
        },
      },

      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor',
        },
      },

      {
        $unwind: '$vendor',
      },

      {
        $project: {
          vendorId: '$_id',

          vendorName: '$vendor.businessName',

          totalOrders: 1,

          settledOrders: 1,

          unsettledOrders: 1,

          totalSales: 1,

          totalPlatformCommission: 1,

          totalInfluencerCommission: 1,

          totalGrossProfit: 1,

          totalNetProfit: 1,

          totalVendorPayout: 1,
        },
      },

      {
        $sort: {
          totalSales: -1,
        },
      },
    ];

    const vendors = await this.vendorOrderModel.aggregate(vendorPipeline);

    const total = vendors.length;

    return ApiResponse.success('Vendor payout dashboard fetched', {
      filters: {
        month,
        year,
        status: status || 'all',
      },

      summary: summary[0] || {},

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },

      data: vendors.slice(skip, skip + limit),
    });
  }

  async influencerCommissionDetails(
    influencerId: string,
    month?: number,
    year?: number,
  ) {
    const currentDate = new Date();

    month = Number(month) || currentDate.getMonth() + 1;
    year = Number(year) || currentDate.getFullYear();

    const influencer = await this.influencerModel.findById(influencerId).lean();

    if (!influencer) {
      throw new NotFoundException('Influencer not found');
    }

    const commissions = await this.influencerCommisionModel.aggregate([
      {
        $match: {
          influencerId: new Types.ObjectId(influencerId),

          isDelivered: true,

          commissionMonth: month,

          commissionYear: year,
        },
      },

      {
        $lookup: {
          from: 'vendororders',
          localField: 'vendorOrderId',
          foreignField: '_id',
          as: 'vendorOrder',
        },
      },

      {
        $unwind: {
          path: '$vendorOrder',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'vendors',
          localField: 'vendorId',
          foreignField: '_id',
          as: 'vendor',
        },
      },

      {
        $unwind: {
          path: '$vendor',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          vendorOrderId: 1,

          orderId: 1,

          orderAmount: '$finalOrderAmount',

          netProfit: 1,

          platformCommissionAmount: 1,

          status: 1,

          isSettled: 1,

          settledAt: 1,

          deliveredAt: 1,

          vendorName: '$vendor.businessName',

          orderNumber: '$vendorOrder.orderNumber',
        },
      },

      {
        $sort: {
          deliveredAt: -1,
        },
      },
    ]);

    const totalOrders = commissions.length;

    const totalSales = commissions.reduce(
      (sum, item) => sum + (item.orderAmount || 0),
      0,
    );

    const totalPlatformCommission = commissions.reduce(
      (sum, item) => sum + (item.platformCommissionAmount || 0),
      0,
    );

    const slabs = await this.influencerCommissionSlabModel
      .find({
        isActive: true,
      })
      .sort({
        minSales: 1,
      })
      .lean();

    const slab = slabs.find(
      (s) => totalSales >= s.minSales && totalSales <= s.maxSales,
    );

    const commissionRate = slab?.commissionRate || 0;

    const calculatedPayout = Number(
      ((totalPlatformCommission * commissionRate) / 100).toFixed(2),
    );

    const settledAmount = Number(
      commissions
        .filter((x) => x.isSettled)
        .reduce((sum, item) => sum + (item.platformCommissionAmount || 0), 0) *
        (commissionRate / 100),
    );

    const pendingAmount = Number((calculatedPayout - settledAmount).toFixed(2));

    const payoutHistory = await this.influencerPayoutModel
      .find({
        influencerId: new Types.ObjectId(influencerId),

        payoutMonth: month,

        payoutYear: year,
      })
      .sort({
        createdAt: -1,
      })
      .lean();

    return ApiResponse.success('Influencer commission details fetched', {
      influencer: {
        influencerId: influencer._id,

        name: influencer.name,

        totalOrders: influencer.totalOrders,

        totalSales: influencer.totalSales,

        pendingCommission: influencer.pendingCommission,

        paidCommission: influencer.paidCommission,
      },

      filters: {
        month,
        year,
      },

      summary: {
        totalOrders,

        totalSales,

        totalPlatformCommission,

        commissionRate,

        calculatedPayout,

        settledAmount,

        pendingAmount,
      },

      slab: slab
        ? {
            minSales: slab.minSales,

            maxSales: slab.maxSales,

            commissionRate: slab.commissionRate,
          }
        : null,

      payouts: payoutHistory,

      commissions,
    });
  }

  async sendInfluencerInvitationLink(email:string,name:string){
    
  }
}
