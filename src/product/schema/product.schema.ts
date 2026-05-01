import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types, Document } from "mongoose";

export type ProductDocument = Product & Document;

export enum ProductStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: "Vendor", required: true, index: true })
  vendorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy!: Types.ObjectId;

  
  @Prop({ type: Types.ObjectId, ref: "Category", required: true })
  categoryId!: Types.ObjectId;

  
  @Prop({ required: true })
  price!: number;

  @Prop()
  compareAtPrice?: number;

  @Prop({ default: 0 })
  costPrice?: number;

  
  @Prop({ default: 0 })
  stock!: number;

  @Prop({ default: false })
  trackStock!: boolean;

 
  @Prop({ type: [Types.ObjectId], ref: "Media", default: [] })
  images!: Types.ObjectId[];

 
  @Prop({ type: Types.ObjectId, ref: "Media" })
  thumbnail?: Types.ObjectId;


  @Prop({ type: [Types.ObjectId], ref: "ProductVariant", default: [] })
  variants!: Types.ObjectId[];

  
  @Prop()
  metaTitle?: string;

  @Prop()
  metaDescription?: string;

  
  @Prop({ enum: ProductStatus, default: ProductStatus.DRAFT })
  status!: ProductStatus;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes
ProductSchema.index({ vendorId: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ slug: 1 }, { unique: true });