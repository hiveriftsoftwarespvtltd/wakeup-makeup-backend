import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class Vendor {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId!: Types.ObjectId;

  @Prop({ required: true })
  businessName!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop()
  description?: string;

  @Prop()
  address?: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop({type:Types.ObjectId , ref:'Media'})
  logo?: Types.ObjectId

  @Prop({type:Types.ObjectId , ref:'Media'})
  banner?: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  staff!: Types.ObjectId[];

  @Prop({ default: 'PENDING' })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Prop({ default: 0 })
  commissionRate!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);

// Indexes
VendorSchema.index({ ownerId: 1 });
VendorSchema.index({ slug: 1 }, { unique: true });