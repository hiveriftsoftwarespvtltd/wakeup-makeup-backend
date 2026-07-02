import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";


export enum RoleCommission {
    VENDOR = "VENDOR",
    EDUCATOR = "EDUCATOR",
    SERVICE_PROVIDER = "SERVICE_PROVIDER",

}

export enum CommissionOn {
    PROFITVALUE = 'PROFIT_VALUE',
    SALEVALUE = 'SALE_VALUE'
}



export enum CommissionEntityType {
    VENDOR = "VENDOR",
    EDUCATOR = "EDUCATOR",
    SERVICE_PROVIDER = "SERVICE_PROVIDER",
    INFLUENCER = "INFLUENCER",
    AFFLIATE_LINK = "AFFLIATE_LINK",
}

@Schema({ _id: false })
export class CommissionRateSlab {
    @Prop({
        required: true,
        enum: CommissionEntityType
    })
    entityType: CommissionEntityType;

    @Prop({
        required: true,
        enum: CommissionOn,
        default: CommissionOn.PROFITVALUE
    })
    commissionOn: CommissionOn;

    @Prop({
        required: true,
        min: 0,
        max: 100
    })
    commissionPercentage: number;
}

export const CommissionRateSlabSchema =
    SchemaFactory.createForClass(CommissionRateSlab);

@Schema({ timestamps: true })
export class CommissionRate {


    @Prop({
        type: [CommissionRateSlabSchema],
        default: []
    })
    commissions: CommissionRateSlab[];
}

export type CommissionRateDocument =
    CommissionRate & Document;

export const CommissionRateSchema =
    SchemaFactory.createForClass(CommissionRate);