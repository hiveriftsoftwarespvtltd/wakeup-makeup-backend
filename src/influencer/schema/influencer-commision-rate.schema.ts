// ===============================
// influencer-commission.schema.ts
// ===============================

import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  Document,
  Types,
} from 'mongoose';

export type InfluencerCommissionDocument =
  InfluencerCommission & Document;

export enum CommissionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class InfluencerCommission {
  @Prop({
    type: Types.ObjectId,
    ref: 'Influencer',
    required: true,
  })
  influencerId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
    required: true,
  })
  orderId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Coupon',
  })
  couponId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Vendor',
    required: true,
  })
  vendorId!: Types.ObjectId;

  @Prop({
    required: true,
  })
  commissionRate!: number;

  @Prop({
    required: true,
  })
  commissionAmount!: number;

  @Prop({
    enum: CommissionStatus,
    default: CommissionStatus.PENDING,
  })
  status!: CommissionStatus;

  @Prop()
  paidAt?: Date;

  @Prop()
  notes?: string;
}

export const InfluencerCommissionSchema =
  SchemaFactory.createForClass(
    InfluencerCommission,
  );