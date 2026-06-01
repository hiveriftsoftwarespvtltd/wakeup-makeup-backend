import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";



export type ServiceStaffDocument = ServiceStaff & Document
@Schema({ timestamps: true })
export class ServiceStaff {

  @Prop({
    type: Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
  })
  providerId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop()
  phone!: string;

  @Prop()
  email!: string;

  @Prop()
  experienceYears!: number;

  @Prop([String])
  skills!: string[];

  @Prop({
    type: Types.ObjectId,
    ref: 'Media',
  })
  image!: Types.ObjectId;

  @Prop({ default: true })
  isActive!: boolean;
}

export const ServiceStaffSchema = SchemaFactory.createForClass(ServiceStaff)

