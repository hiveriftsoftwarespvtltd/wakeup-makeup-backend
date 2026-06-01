import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";


export type ServiceReviewDocument = ServiceReview & Document
@Schema({ timestamps: true })
export class ServiceReview {

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServiceBooking' })
  bookingId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServiceProvider' })
  providerId!: Types.ObjectId;

  @Prop({ min: 1, max: 5 })
  rating!: number;

  @Prop()
  review!: string;
}

export const ServiceReviewSchema = SchemaFactory.createForClass(ServiceReview)