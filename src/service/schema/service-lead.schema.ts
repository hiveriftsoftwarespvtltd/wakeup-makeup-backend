import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export enum ServiceLeadStatus {
  OPEN = "OPEN",
  ASSIGNED = "ASSIGNED",
  BOOKED = "BOOKED",
  EXPIRED = "EXPIRED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",

}

export type ServiceLeadDocument = ServiceLead & Document
@Schema({ timestamps: true })
export class ServiceLead {

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServiceCategory' })
  categoryId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServiceProvider' })
  assignedProviderId?: Types.ObjectId;

  @Prop()
  pincode!: string;

  @Prop()
  name!: string;

  @Prop()
  email!: string;

  @Prop()
  phoneNumber!: string;

  @Prop()
  city!: string;

  @Prop()
  state!: string;

  @Prop()
  requirement!: string;

  @Prop()
  budget!: number;

  @Prop()
  preferredDate!: Date;

  @Prop()
  address!: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
  })
  locationType!: string;

  @Prop({
    type: [Number],
    default: [0, 0],
  })
  coordinates!: number[];


  @Prop({
    enum: ServiceLeadStatus,
    default: ServiceLeadStatus.OPEN,
  })
  status!: string;
}

export const ServiceLeadSchema = SchemaFactory.createForClass(ServiceLead)

ServiceLeadSchema.index({ coordinates: '2dsphere' });