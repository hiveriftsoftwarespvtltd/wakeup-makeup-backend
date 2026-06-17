import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum EducatorWalletTransactionType {
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT',
}

export enum EducatorWalletTransactionReason {
    COMMISSION_EARNING = 'COMMISSION_EARNING',
    REFERRAL_BONUS = 'REFERRAL_BONUS',
    WITHDRAWAL = 'WITHDRAWAL',
    ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
    COURSE_PURCHASE_EARNING = 'COURSE_PURCHASE_EARNING',
}

export type EducatorWalletTransactionDocument = EducatorWalletTransaction & Document;

@Schema({ timestamps: true })
export class EducatorWalletTransaction {
    @Prop({
        type: Types.ObjectId,
        ref: 'EducatorWallet',
        required: true,
    })
    walletId!: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'Educator',
        required: true,
    })
    educatorId!: Types.ObjectId;

    @Prop({
        required: true,
    })
    amount!: number;

    @Prop({
        enum: EducatorWalletTransactionType,
        required: true,
    })
    type!: EducatorWalletTransactionType;

    @Prop({
        enum: EducatorWalletTransactionReason,
        required: true,
    })
    reason!: EducatorWalletTransactionReason;

    @Prop({
        type: Types.ObjectId,
        ref: 'CoursePurchase',
    })
    coursePurchaseId?: Types.ObjectId;

    @Prop()
    description?: string;

    @Prop({
        required: true,
    })
    balanceAfterTransaction!: number;
}

export const EducatorWalletTransactionSchema = SchemaFactory.createForClass(EducatorWalletTransaction);
