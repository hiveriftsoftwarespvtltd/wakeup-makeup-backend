import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceProviderWalletDocument = ServiceProviderWallet & Document;

@Schema({ timestamps: true })
export class ServiceProviderWallet {
    @Prop({
        type: Types.ObjectId,
        ref: 'ServiceProvider',
        required: true,
        unique: true,
    })
    serviceProviderId!: Types.ObjectId;

    @Prop({
        type: Number,
        default: 0,
        min: 0,
    })
    balance!: number;

    @Prop({
        type: Number,
        default: 0,
        min: 0,
    })
    pendingBalance!: number;

    @Prop({
        type: Number,
        default: 0,
        min: 0,
    })
    totalEarnings!: number;

    @Prop({
        type: Number,
        default: 0,
        min: 0,
    })
    totalWithdrawn!: number;

    @Prop({
        type: Boolean,
        default: true,
    })
    isActive!: boolean;
}

export const ServiceProviderWalletSchema = SchemaFactory.createForClass(ServiceProviderWallet);
