import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VendorWalletDocument = VendorWallet & Document;

@Schema({ timestamps: true })
export class VendorWallet {
    @Prop({
        type: Types.ObjectId,
        ref: 'Vendor',
        required: true,
        unique: true,
    })
    vendorId!: Types.ObjectId;

    @Prop({
        type: Number,
        default: 0,
        min: 0,
    })
    balance!: number;

    @Prop({
        type: Number,
        default: 0,
        min: 0,
    })
    pendingBalance!: number;

    @Prop({
        type: Number,
        default: 0,
        min: 0,
    })
    totalEarnings!: number;

    @Prop({
        type: Number,
        default: 0,
        min: 0,
    })
    totalWithdrawn!: number;

    @Prop({
        type: Boolean,
        default: true,
    })
    isActive!: boolean;
}

export const VendorWalletSchema = SchemaFactory.createForClass(VendorWallet);
