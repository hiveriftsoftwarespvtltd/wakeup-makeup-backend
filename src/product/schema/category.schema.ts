import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types, Document } from "mongoose";

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  slug!: string;

  @Prop()
  description?: string;

  // @Prop({
  //   type:[
  //     {name:String,isVariant:Boolean,values:[String]}
  //   ],default:[]
  // })
  // attributes!:{
  //   name:string,
  //   isVariant:boolean,
  //   values:string[]
  // }[]

 
  // 🌳 Parent category (for tree structure)
  // @Prop({ type: Types.ObjectId, ref: "Category", default: null })
  // parentId?: Types.ObjectId;

  // 🏢 Multi-tenant support
  @Prop({ type: Types.ObjectId, ref: "Vendor", required: true })
  vendorId!: Types.ObjectId;

  @Prop({type:Types.ObjectId, ref:"User",required:true})
  ownerId!:Types.ObjectId

  // 🖼️ Category Image
  @Prop({ type: Types.ObjectId, ref: "Media" })
  image?: Types.ObjectId;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);



