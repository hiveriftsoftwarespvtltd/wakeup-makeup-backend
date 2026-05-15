// ===============================
// coupon.schema.ts
// ===============================

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Types } from 'mongoose';

export type CouponDocument = Coupon & Document;

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum CouponScope {
  PLATFORM = 'platform',
  VENDOR = 'vendor',
  INFLUENCER = 'influencer',
}

@Schema({ timestamps: true })
export class Coupon {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  code!: string;

  @Prop({
    enum: CouponType,
    required: true,
  })
  type!: CouponType;

  @Prop({
    required: true,
  })
  value!: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'Vendor',
  })
  vendorId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Influencer',
  })
  influencerId?: Types.ObjectId;

  @Prop({
    enum: CouponScope,
    default: CouponScope.PLATFORM,
  })
  scope!: CouponScope;

  @Prop({
    default: 0,
  })
  minimumOrderAmount!: number;

  @Prop()
  maximumDiscount?: number;

  @Prop({
    default: 1,
  })
  usageLimitPerUser!: number;

  @Prop({
    default: 0,
  })
  totalUsageLimit!: number;

  @Prop({
    default: 0,
  })
  totalUsed!: number;

  @Prop({
    default: true,
  })
  isActive!: boolean;

  @Prop()
  startsAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop()
  description?: string;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
