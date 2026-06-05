import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DistributorWalletTransactionType {
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT',
}

export enum DistributorWalletTransactionReason {
    DISTRIBUTION_MARGIN = 'DISTRIBUTION_MARGIN',
    WITHDRAWAL = 'WITHDRAWAL',
    ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
}

export type DistributorWalletTransactionDocument = DistributorWalletTransaction & Document;

@Schema({ timestamps: true })
export class DistributorWalletTransaction {
    @Prop({
        type: Types.ObjectId,
        ref: 'DistributorWallet',
        required: true,
    })
    walletId!: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'Distributor',
        required: true,
    })
    distributorId!: Types.ObjectId;

    @Prop({
        required: true,
    })
    amount!: number;

    @Prop({
        enum: DistributorWalletTransactionType,
        required: true,
    })
    type!: DistributorWalletTransactionType;

    @Prop({
        enum: DistributorWalletTransactionReason,
        required: true,
    })
    reason!: DistributorWalletTransactionReason;

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

export const DistributorWalletTransactionSchema = SchemaFactory.createForClass(DistributorWalletTransaction);
