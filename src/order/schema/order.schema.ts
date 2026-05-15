// ===============================
// order.schema.ts
// ===============================

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

// ===============================
// ENUMS
// ===============================

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum PaymentMethod {
  CASH_ON_DELIVERY = 'CashOnDelivery',
  ONLINE = 'Online',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// ===============================
// ORDER ITEM
// ===============================

@Schema({ _id: false })
export class OrderItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'ProductVariant',
    required: true,
  })
  variantId!: Types.ObjectId;

  @Prop({
    required: true,
  })
  productName!: string;

  @Prop({
    required: true,
  })
  sku!: string;

  @Prop({
    type: Object,
    default: {},
  })
  attributes!: Record<string, string>;

  @Prop({
    required: true,
  })
  quantity!: number;

  @Prop({
    required: true,
  })
  price!: number;

  @Prop({
    default: 0,
  })
  salesPrice!: number;

  @Prop({
    required: true,
  })
  totalPrice!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

// ===============================
// APPLIED COUPON SNAPSHOT
// ===============================

@Schema({ _id: false })
export class AppliedCoupon {
  @Prop()
  code?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Coupon',
  })
  couponId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Influencer',
  })
  influencerId?: Types.ObjectId;

  @Prop()
  influencerName?: string;

  @Prop()
  influencerCode?: string;

  @Prop({ required: true })
  couponType!: string;

  @Prop({ required: true })
  couponValue!: string;

  @Prop({
    default: 0,
  })
  discountAmount?: number;

  @Prop({
    default: 0,
  })
  influencerCommissionRate?: number;

  @Prop({
    default: 0,
  })
  influencerCommissionAmount?: number;
}

export const AppliedCouponSchema = SchemaFactory.createForClass(AppliedCoupon);

@Schema({ _id: false })
export class ShippingAddress {
  @Prop()
  fullName!: string;

  @Prop()
  phone!: string;

  @Prop()
  line1!: string;

  @Prop()
  line2?: string;

  @Prop()
  city!: string;

  @Prop()
  state!: string;

  @Prop()
  pincode!: string;

  @Prop({ default: 'India' })
  country?: string;
}

const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId!: Types.ObjectId;

  
  @Prop({
    type: Types.ObjectId,
    ref: 'Vendor',
    required: true,
  })
  vendorId!: Types.ObjectId;

  @Prop({
    type: ShippingAddress,
    required: true,
  })
  shippingAddress!: ShippingAddress;

  @Prop({
    unique: true,
  })
  orderNumber!: string;

  @Prop({
    default: 0,
  })
  refundAmount!: number;

  @Prop({
    default: 0,
  })
  vendorPayoutAmount!: number;

  @Prop()
  vendorPaidAt?: Date;

  @Prop({
    default: false,
  })
  vendorPaid!: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'Address',
  })
  addressId?: Types.ObjectId;

  @Prop({
    type: [OrderItemSchema],
    default: [],
  })
  items!: OrderItem[];

  @Prop({
    type: AppliedCouponSchema,
  })
  appliedCoupon?: AppliedCoupon;

  
  @Prop({
    enum: PaymentMethod,
    default: PaymentMethod.CASH_ON_DELIVERY,
  })
  paymentMethod!: PaymentMethod;

  @Prop({
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  // gateway integration later
  @Prop()
  transactionId?: string;

  @Prop()
  paymentGateway?: string;

  @Prop({
    type: Object,
  })
  paymentMeta?: Record<string, any>;

  // order status
  @Prop({
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  orderStatus!: OrderStatus;

  // pricing
  @Prop({
    default: 0,
  })
  subTotal!: number;

  @Prop({
    default: 0,
  })
  discount!: number;

  @Prop({
    default: 0,
  })
  shippingCharge!: number;

  @Prop({
    default: 0,
  })
  tax!: number;

  @Prop({
    required: true,
  })
  grandTotal!: number;

  // tracking
  @Prop()
  trackingId?: string;

  @Prop()
  shippedAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  }
  )
  cancelledBy?: Types.ObjectId

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  @Prop()
  returnReason?: string;

  // purchase date
  @Prop({
    default: Date.now,
  })
  dateOfPurchase!: Date;

  @Prop()
  notes?: string;

  @Prop({
    default: false,
  })
  isDeleted!: boolean;

  @Prop()
  estimatedDeliveryDate?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
