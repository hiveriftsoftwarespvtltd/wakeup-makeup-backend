import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ServiceProviderWalletTransactionType {
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT',
}

export enum ServiceProviderWalletTransactionReason {
    SERVICE_EARNING = 'SERVICE_EARNING',
    WITHDRAWAL = 'WITHDRAWAL',
    REFUND_DEDUCTION = 'REFUND_DEDUCTION',
    ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
    PENALTY = 'PENALTY',
}

export type ServiceProviderWalletTransactionDocument = ServiceProviderWalletTransaction & Document;

@Schema({ timestamps: true })
export class ServiceProviderWalletTransaction {
    @Prop({
        type: Types.ObjectId,
        ref: 'ServiceProviderWallet',
        required: true,
    })
    walletId!: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'ServiceProvider',
        required: true,
    })
    serviceProviderId!: Types.ObjectId;

    @Prop({
        required: true,
    })
    amount!: number;

    @Prop({
        enum: ServiceProviderWalletTransactionType,
        required: true,
    })
    type!: ServiceProviderWalletTransactionType;

    @Prop({
        enum: ServiceProviderWalletTransactionReason,
        required: true,
    })
    reason!: ServiceProviderWalletTransactionReason;

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

export const ServiceProviderWalletTransactionSchema = SchemaFactory.createForClass(ServiceProviderWalletTransaction);
