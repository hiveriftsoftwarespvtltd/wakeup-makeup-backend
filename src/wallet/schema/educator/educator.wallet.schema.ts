import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types, Document } from "mongoose";

export type EducatorWalletDocument = EducatorWallet & Document;



@Schema({ timestamps: true })
export class EducatorWallet {
    @Prop({
        type: Types.ObjectId,
        ref: 'Educator',
        required: true,
        unique: true,
    })
    educatorId!: Types.ObjectId;

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

export const EducatorWalletSchema = SchemaFactory.createForClass(EducatorWallet);