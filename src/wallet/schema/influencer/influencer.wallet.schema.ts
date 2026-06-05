import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InfluencerWalletDocument = InfluencerWallet & Document;

@Schema({ timestamps: true })
export class InfluencerWallet {
    @Prop({
        type: Types.ObjectId,
        ref: 'Influencer',
        required: true,
        unique: true,
    })
    influencerId!: Types.ObjectId;

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

export const InfluencerWalletSchema = SchemaFactory.createForClass(InfluencerWallet);
