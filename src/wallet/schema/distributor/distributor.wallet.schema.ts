import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DistributorWalletDocument = DistributorWallet & Document;

@Schema({ timestamps: true })
export class DistributorWallet {
    @Prop({
        type: Types.ObjectId,
        ref: 'Distributor',
        required: true,
        unique: true,
    })
    distributorId!: Types.ObjectId;

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

export const DistributorWalletSchema = SchemaFactory.createForClass(DistributorWallet);
