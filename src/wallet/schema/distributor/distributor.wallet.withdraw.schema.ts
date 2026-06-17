import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DistributorWithdrawalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    PROCESSED = 'PROCESSED',
    REJECTED = 'REJECTED',
}

export type DistributorWalletWithdrawDocument = DistributorWalletWithdraw & Document;

@Schema({ timestamps: true })
export class DistributorWalletWithdraw {
    @Prop({
        type: Types.ObjectId,
        ref: 'Distributor',
        required: true,
    })
    distributorId!: Types.ObjectId;

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
        enum: DistributorWithdrawalStatus,
        default: DistributorWithdrawalStatus.PENDING,
    })
    status!: DistributorWithdrawalStatus;

    @Prop()
    transactionReference?: string;

    @Prop()
    adminNote?: string;
}

export const DistributorWalletWithdrawSchema = SchemaFactory.createForClass(DistributorWalletWithdraw);
