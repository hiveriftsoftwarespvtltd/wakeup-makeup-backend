import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types, Document } from "mongoose";

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop()
  description?: string;

  // 🌳 Parent category (for tree structure)
  @Prop({ type: Types.ObjectId, ref: "Category", default: null })
  parentId?: Types.ObjectId;

  // 🏢 Multi-tenant support
  @Prop({ type: Types.ObjectId, ref: "Vendor", required: true, index: true })
  vendorId!: Types.ObjectId;

  // 🖼️ Category Image
  @Prop({ type: Types.ObjectId, ref: "Media" })
  image?: Types.ObjectId;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes
CategorySchema.index({ vendorId: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ slug: 1, vendorId: 1 }, { unique: true });