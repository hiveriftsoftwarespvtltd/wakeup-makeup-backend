import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserReview, UserReviewDocument } from './schema/user-review.schema';
import { Product, ProductDocument } from 'src/product/schema/product.schema';
import { VendorOrder, VendorOrderDocument } from 'src/order/schema/vendor-order.schema';
import { CreateReviewDto, UpdateReviewDto } from './dto/reviewDTO';
import { OrderStatus } from 'src/order/schema/order.schema';



@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(UserReview.name)
    private reviewModel: Model<UserReviewDocument>,

    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,

    @InjectModel(VendorOrder.name)
    private vendorOrderModel: Model<VendorOrderDocument>,
  ) {}

  async createReview(
    userId: string,
    dto: CreateReviewDto,
  ) {
    const product = await this.productModel.findById(
      dto.productId,
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // prevent duplicate review
    const existingReview = await this.reviewModel.findOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(dto.productId),
      isDeleted: false,
    });

    if (existingReview) {
      throw new BadRequestException(
        'You already reviewed this product',
      );
    }

    // verified purchase check
    const vendorOrder = await this.vendorOrderModel.findOne({
      userId: new Types.ObjectId(userId),
      orderStatus: OrderStatus.DELIVERED,
      'items.productId': new Types.ObjectId(dto.productId),
    });

    const review = await this.reviewModel.create({
      userId,
      productId: dto.productId,
      rating: dto.rating,
      title: dto.title,
      review: dto.review,
      images: dto.images || [],
      vendorOrderId: vendorOrder?._id,
      isVerifiedPurchase: !!vendorOrder,
    });

    await this.updateProductRating(dto.productId);

    return review;
  }

  async updateReview(
    userId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ) {
    const review = await this.reviewModel.findOne({
      _id: new Types.ObjectId(reviewId),
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    Object.assign(review, dto);

    await review.save();

    await this.updateProductRating(
      review.productId.toString(),
    );

    return review;
  }

  async deleteReview(
    userId: string,
    reviewId: string,
  ) {
    const review = await this.reviewModel.findOne({
      _id: new Types.ObjectId(reviewId),
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isDeleted = true;

    await review.save();

    await this.updateProductRating(
      review.productId.toString(),
    );

    return {
      message: 'Review deleted successfully',
    };
  }

  async getProductReviews(productId: string) {
    return await this.reviewModel
      .find({
        productId: new Types.ObjectId(productId),
        isDeleted: false,
        isActive: true,
      })
      .populate('userId', 'name avatar')
      .populate('images')
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateProductRating(productId: string) {
    const stats = await this.reviewModel.aggregate([
      {
        $match: {
          productId: new Types.ObjectId(productId),
          isDeleted: false,
          isActive: true,
        },
      },

      {
        $group: {
          _id: '$productId',
          averageRating: {
            $avg: '$rating',
          },
          totalReviews: {
            $sum: 1,
          },
        },
      },
    ]);

    const averageRating =
      stats.length > 0
        ? Number(stats[0].averageRating.toFixed(1))
        : 0;

    const totalReviews =
      stats.length > 0
        ? stats[0].totalReviews
        : 0;

    await this.productModel.findByIdAndUpdate(
      productId,
      {
        averageRating,
        totalReviews,
      },
    );
  }
}