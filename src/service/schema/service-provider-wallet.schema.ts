import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


export type ServiceProviderWalletDocument = ServiceProviderWallet & Document
@Schema({ timestamps: true })
export class ServiceProviderWallet {

  @Prop({
    type: Types.ObjectId,
    ref: 'ServiceProvider',
    unique: true,
  })
  providerId!: Types.ObjectId;

  @Prop({ default: 0 })
  availableBalance!: number;

  @Prop({ default: 0 })
  pendingBalance!: number;

  @Prop({ default: 0 })
  totalEarned!: number;
}

export const ServiceProviderWalletSchema = SchemaFactory.createForClass(ServiceProviderWallet)