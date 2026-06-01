import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


export type ProviderAvailabilityDocument = ProviderAvailability & Document
@Schema()
export class ProviderAvailability {

  @Prop({
    type: Types.ObjectId,
    ref: 'ServiceProvider',
  })
  providerId!: Types.ObjectId;

  @Prop()
  dayOfWeek!: number;

  @Prop()
  startTime!: string;

  @Prop()
  endTime!: string;

  @Prop()
  breakStart!: string;

  @Prop()
  breakEnd!: string;
}

export const ProviderAvailabilitySchema = SchemaFactory.createForClass(ProviderAvailability)