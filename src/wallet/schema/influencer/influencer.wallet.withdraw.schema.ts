import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum InfluencerWithdrawalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    PROCESSED = 'PROCESSED',
    REJECTED = 'REJECTED',
}

export type InfluencerWalletWithdrawDocument = InfluencerWalletWithdraw & Document;

@Schema({ timestamps: true })
export class InfluencerWalletWithdraw {
    @Prop({
        type: Types.ObjectId,
        ref: 'Influencer',
        required: true,
    })
    influencerId!: Types.ObjectId;

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
        enum: InfluencerWithdrawalStatus,
        default: InfluencerWithdrawalStatus.PENDING,
    })
    status!: InfluencerWithdrawalStatus;

    @Prop()
    transactionReference?: string;

    @Prop()
    adminNote?: string;
}

export const InfluencerWalletWithdrawSchema = SchemaFactory.createForClass(InfluencerWalletWithdraw);
