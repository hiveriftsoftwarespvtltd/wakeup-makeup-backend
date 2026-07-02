import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export enum VehicleType {
    MOTORCYCLE = 'motorcycle',
    BICYCLE = 'bicycle',
    WALKING = 'walking'
}

export type DeliveryPersonDocument = DeliveryPerson & Document
@Schema({ timestamps: true })
export class DeliveryPerson {

    @Prop({ type: Types.ObjectId, ref: 'Vendor' })
    vendorId!: Types.ObjectId

    @Prop({ required: true })
    name!: string

    @Prop({ required: true })
    phone!: number

    @Prop({ type: String, enum: VehicleType, default: VehicleType.MOTORCYCLE })
    vehicleType!: VehicleType

    @Prop()
    vehicleNumber?: string

    @Prop({ default: true })
    isActive!: boolean

    @Prop({ default: false })
    isDeleted!: boolean
}

export const DeliveryPersonSchema = SchemaFactory.createForClass(DeliveryPerson)