import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum VendorWithdrawalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    PROCESSED = 'PROCESSED',
    REJECTED = 'REJECTED',
}

export type VendorWalletWithdrawDocument = VendorWalletWithdraw & Document;

@Schema({ timestamps: true })
export class VendorWalletWithdraw {
    @Prop({
        type: Types.ObjectId,
        ref: 'Vendor',
        required: true,
    })
    vendorId!: Types.ObjectId;

    @Prop({
        required: true,
        min: 1,
    })
    amount!: number;

    @Prop({
        type: Types.ObjectId,
        ref: 'BankAccount',
        required: true,
    })
    bankAccountId!: Types.ObjectId;

    @Prop({
        enum: VendorWithdrawalStatus,
        default: VendorWithdrawalStatus.PENDING,
    })
    status!: VendorWithdrawalStatus;

    @Prop()
    transactionReference?: string;

    @Prop()
    adminNote?: string;
}

export const VendorWalletWithdrawSchema = SchemaFactory.createForClass(VendorWalletWithdraw);
