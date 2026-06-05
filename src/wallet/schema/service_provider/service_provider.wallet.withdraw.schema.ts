import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ServiceProviderWithdrawalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    PROCESSED = 'PROCESSED',
    REJECTED = 'REJECTED',
}

export type ServiceProviderWalletWithdrawDocument = ServiceProviderWalletWithdraw & Document;

@Schema({ timestamps: true })
export class ServiceProviderWalletWithdraw {
    @Prop({
        type: Types.ObjectId,
        ref: 'ServiceProvider',
        required: true,
    })
    serviceProviderId!: Types.ObjectId;

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
        enum: ServiceProviderWithdrawalStatus,
        default: ServiceProviderWithdrawalStatus.PENDING,
    })
    status!: ServiceProviderWithdrawalStatus;

    @Prop()
    transactionReference?: string;

    @Prop()
    adminNote?: string;
}

export const ServiceProviderWalletWithdrawSchema = SchemaFactory.createForClass(ServiceProviderWalletWithdraw);
