import { Coupon, CouponDocument, CouponType } from './schema/coupon.schema';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCouponDto, UpdateCouponDTO } from './dto/coupon.dto';
import { ApiResponse } from 'src/common/responses/api-response';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name)
    private couponModel: Model<CouponDocument>,
  ) {}

  async create(dto: CreateCouponDto) {
    const existing = await this.couponModel.findOne({
      code: dto.code.toUpperCase(),
    });

    if (existing) {
      throw new ConflictException('Coupon already exists');
    }

    const coupon = await this.couponModel.create({
      ...dto,
      code: dto.code.toUpperCase(),
      vendorId: dto.vendorId ? new Types.ObjectId(dto.vendorId) : undefined,
      influencerId: dto.influencerId
        ? new Types.ObjectId(dto.influencerId)
        : undefined,
    });

    return coupon;
  }

  async validateCoupon(code: string, total: number) {
    const coupon = await this.couponModel.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (total < coupon.minimumOrderAmount) {
      throw new BadRequestException('Minimum amount not reached');
    }

    let discount = 0;

    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (total * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }

    if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
      discount = coupon.maximumDiscount;
    }

    return {
      coupon,
      discount,
    };
  }

  async getAllCoupons() {
    return this.couponModel.find().lean() || [];
  }

  async couponDetails(id: string) {
    const coupon = await this.couponModel.findById(new Types.ObjectId(id));
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return ApiResponse.success('Coupon Details fetched succesfuuly', coupon);
  }

  async updateCoupon(dto: UpdateCouponDTO, id: string) {
    const coupon = await this.couponModel.findById(new Types.ObjectId(id));
    if (!coupon) {
      throw new NotFoundException('Coupon Not Found');
    }

    const filteredDTO = Object.fromEntries(
      Object.entries(dto).filter(
        ([_, value]) => value !== undefined && value !== null && value !== '',
      ),
    );

    await this.couponModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: filteredDTO },
    );

    return ApiResponse.success('Coupon Updated Successfully!', coupon);
  }

  async deleteCoupon(id: string) {
    const coupon = await this.couponModel.findById(new Types.ObjectId(id));
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    await coupon.deleteOne();
    return ApiResponse.success('Coupon Deleted Successfully');
  }
}
