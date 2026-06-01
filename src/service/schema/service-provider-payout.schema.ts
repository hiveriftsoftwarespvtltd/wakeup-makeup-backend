import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


export enum ServiceProviderPayoutStatus{
  PENDING="PENDING",
  PAID="PAID"
}

export type ServiceProviderPayoutDocument = ServicerProviderPayout & Document
@Schema({ timestamps: true })
export class ServicerProviderPayout {

  @Prop({
    type: Types.ObjectId,
    ref: 'ServiceProvider',
  })
  providerId!: Types.ObjectId;

  @Prop([Types.ObjectId])
  bookingIds!: Types.ObjectId[];

  @Prop()
  amount!: number;

  @Prop()
  transactionId!: string;

  @Prop({
    enum: ServiceProviderPayoutStatus,
    default: ServiceProviderPayoutStatus.PENDING,
  })
  status!: string;

  @Prop()
  paidAt!: Date;
}

export const ServiceProviderPayoutSchema = SchemaFactory.createForClass(ServicerProviderPayout)