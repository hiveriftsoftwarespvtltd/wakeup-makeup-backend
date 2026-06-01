import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


export enum BookingStatus{
    PENDING="PENDING",
    CONFIRMED="CONFIRMED",
    ONGOING="ONGOING",
    CANCELLED="CANCELLED",
    COMPLETED="COMPLETED"
}

export enum BookingPaymentStatus{
  PENDING="PENDING",
  PAID="PAID",
  REFUNDED="REFUNDED"
}

export type ServiceBookingDocument = ServiceBooking & Document
@Schema({ timestamps: true })
export class ServiceBooking {

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServiceProvider' })
  providerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  staffId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service' })
  serviceId!: Types.ObjectId;

  @Prop()
  bookingDate!: Date;

  @Prop()
  slotStartTime!: string;

  @Prop()
  slotEndTime!: string;

  @Prop()
  serviceAddress!: string;

  @Prop()
  subtotal!: number;

  @Prop()
  couponDiscount!: number;

  @Prop()
  influencerDiscount!: number;

  @Prop()
  platformCommission!: number;

  @Prop()
  totalAmount!: number;

  @Prop({
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  bookingStatus!: BookingStatus;

  @Prop({
    enum: BookingPaymentStatus,
    default: BookingPaymentStatus.PENDING,
  })
  paymentStatus!: string;
}

export const ServiceBookingSchema = SchemaFactory.createForClass(ServiceBooking)