import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum InfluencerWalletTransactionType {
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT',
}

export enum InfluencerWalletTransactionReason {
    COMMISSION_EARNING = 'COMMISSION_EARNING',
    REFERRAL_BONUS = 'REFERRAL_BONUS',
    WITHDRAWAL = 'WITHDRAWAL',
    ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
}

export type InfluencerWalletTransactionDocument = InfluencerWalletTransaction & Document;

@Schema({ timestamps: true })
export class InfluencerWalletTransaction {
    @Prop({
        type: Types.ObjectId,
        ref: 'InfluencerWallet',
        required: true,
    })
    walletId!: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'Influencer',
        required: true,
    })
    influencerId!: Types.ObjectId;

    @Prop({
        required: true,
    })
    amount!: number;

    @Prop({
        enum: InfluencerWalletTransactionType,
        required: true,
    })
    type!: InfluencerWalletTransactionType;

    @Prop({
        enum: InfluencerWalletTransactionReason,
        required: true,
    })
    reason!: InfluencerWalletTransactionReason;

    @Prop({
        type: Types.ObjectId,
        ref: 'Order',
    })
    orderId?: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'ServiceBooking',
    })
    bookingId?: Types.ObjectId;

    @Prop()
    description?: string;

    @Prop({
        required: true,
    })
    balanceAfterTransaction!: number;
}

export const InfluencerWalletTransactionSchema = SchemaFactory.createForClass(InfluencerWalletTransaction);
