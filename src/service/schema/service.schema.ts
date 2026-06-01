import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";


export enum ServiceType{
  HOME="HOME",
  SALON="SALON",
  BOTH="BOTH"
}

export type ServiceDocument = Service & Document
@Schema({ timestamps: true })
export class Service {

  @Prop({
    type: Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
  })
  providerId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'ServiceCategory',
    required: true,
  })
  categoryId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description!: string;

  @Prop({ required: true })
  durationMinutes!: number;

  @Prop({ required: true })
  price!: number;

  @Prop()
  discountedPrice!: number;

  @Prop({
    enum: ServiceType,
    default: ServiceType.BOTH,
  })
  serviceType!: string;

  @Prop({
    type: [Types.ObjectId],
    ref: 'Media',
  })
  images!: Types.ObjectId[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(Service)