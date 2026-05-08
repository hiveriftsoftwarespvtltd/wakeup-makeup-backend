import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";


export type ProductVariantDocument = ProductVariant & Document

@Schema({timestamps:true})
export class ProductVariant{
    @Prop({type:Types.ObjectId,ref:"Product",required:true,index:true})
    productId!:Types.ObjectId

    @Prop({ type: [Types.ObjectId], ref: "Media", default: [] })
    images?: Types.ObjectId[];

    @Prop({type:Types.ObjectId,ref:"Media"})
    thumbnail?:Types.ObjectId

    @Prop({required:true})
    sku!:string

    @Prop({required:true})
    price!:number

    @Prop()
    salesPrice?:number

    @Prop({required:true,default:0})
    stock!:number

    @Prop({type:Map,of:String})
    attributes!:Record<string,string>

    @Prop({default:true})
    isActive!:boolean
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);