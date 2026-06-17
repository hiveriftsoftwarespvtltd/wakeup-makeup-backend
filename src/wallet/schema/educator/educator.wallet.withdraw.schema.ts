import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum EducatorWithdrawalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    PROCESSED = 'PROCESSED',
    REJECTED = 'REJECTED',
}

export type EducatorWalletWithdrawDocument = EducatorWalletWithdraw & Document;

@Schema({ timestamps: true })
export class EducatorWalletWithdraw {
    @Prop({
        type: Types.ObjectId,
        ref: 'Educator',
        required: true,
    })
    educatorId!: Types.ObjectId;

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
        enum: EducatorWithdrawalStatus,
        default: EducatorWithdrawalStatus.PENDING,
    })
    status!: EducatorWithdrawalStatus;

    @Prop()
    transactionReference?: string;

    @Prop()
    adminNote?: string;
}

export const EducatorWalletWithdrawSchema = SchemaFactory.createForClass(EducatorWalletWithdraw);
