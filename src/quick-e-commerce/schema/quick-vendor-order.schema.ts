import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


export enum VendorOrderStatus {

    PREPARING = "PREPARING",

    WAITING_FOR_DELIVERY_BOY = "WAITING_FOR_DELIVERY_BOY",

    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",

    DELIVERED = "DELIVERED",

    CANCELLED = "CANCELLED"
}

export type VendorOrderDocument = VendorQuickOrder & Document
@Schema({ timestamps: true })
export class VendorQuickOrder {

    @Prop({ type: Types.ObjectId, ref: "QuickOrder" })
    quickOrderId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: "Vendor" })
    vendorId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: "DeliveryPerson", default: null })
    deliveryPersonId: Types.ObjectId | null;

    @Prop()
    subtotal: number;

    @Prop()
    packingCharge: number;

    @Prop()
    deliveryCharge: number;

    @Prop()
    tax: number;

    @Prop()
    total: number;

    @Prop()
    estimatedPreparationMinutes: number;

    @Prop()
    estimatedDeliveryMinutes: number;

    @Prop()
    acceptedAt: Date;

    @Prop()
    readyAt: Date;

    @Prop({
        enum: VendorOrderStatus,
        default: VendorOrderStatus.PREPARING
    })
    status: VendorOrderStatus;

}

export const VendorOrderSchema = SchemaFactory.createForClass(VendorQuickOrder)