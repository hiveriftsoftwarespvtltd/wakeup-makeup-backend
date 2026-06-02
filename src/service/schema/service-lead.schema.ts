import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export enum ServiceLeadStatus{
  OPEN="OPEN",
  ASSIGNED="ASSIGNED",
  BOOKED="BOOKED",
  EXPIRED="EXPIRED"
}

export type  ServiceLeadDocument = ServiceLead & Document
@Schema({ timestamps: true })
export class ServiceLead {

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServiceCategory' })
  categoryId!: Types.ObjectId;

  @Prop()
  requirement!: string;

  @Prop()
  budget!: number;

  @Prop()
  preferredDate!: Date;

  @Prop()
  address!: string;

  @Prop({
    enum:ServiceLeadStatus,
    default: ServiceLeadStatus.OPEN,
  })
  status!: string;
}

export const ServiceLeadSchema = SchemaFactory.createForClass(ServiceLead)