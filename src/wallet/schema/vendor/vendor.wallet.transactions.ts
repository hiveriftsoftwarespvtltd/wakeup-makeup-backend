import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum VendorWalletTransactionType {
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT',
}

export enum VendorWalletTransactionReason {
    PRODUCT_SALE_EARNING = 'PRODUCT_SALE_EARNING',
    WITHDRAWAL = 'WITHDRAWAL',
    REFUND_DEDUCTION = 'REFUND_DEDUCTION',
    ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
    PENALTY = 'PENALTY',
}

export type VendorWalletTransactionDocument = VendorWalletTransaction & Document;

@Schema({ timestamps: true })
export class VendorWalletTransaction {
    @Prop({
        type: Types.ObjectId,
        ref: 'VendorWallet',
        required: true,
    })
    walletId!: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'Vendor',
        required: true,
    })
    vendorId!: Types.ObjectId;

    @Prop({
        required: true,
    })
    amount!: number;

    @Prop({
        enum: VendorWalletTransactionType,
        required: true,
    })
    type!: VendorWalletTransactionType;

    @Prop({
        enum: VendorWalletTransactionReason,
        required: true,
    })
    reason!: VendorWalletTransactionReason;

    @Prop({
        type: Types.ObjectId,
        ref: 'Order',
    })
    orderId?: Types.ObjectId;

    @Prop()
    description?: string;

    @Prop({
        required: true,
    })
    balanceAfterTransaction!: number;
}

export const VendorWalletTransactionSchema = SchemaFactory.createForClass(VendorWalletTransaction);
