import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


export type ServiceSlotDocument = ServiceSlot & Document
@Schema()
export class ServiceSlot {

  @Prop({
    type: Types.ObjectId,
    ref: 'Staff',
  })
  staffId!: Types.ObjectId;

  @Prop()
  date!: Date;

  @Prop()
  startTime!: string;

  @Prop()
  endTime!: string;

  @Prop({ default: false })
  isBooked!: boolean;
}

export const ServcieSlotSchema = SchemaFactory.createForClass(ServiceSlot)