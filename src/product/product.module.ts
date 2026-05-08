import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schema/product.schema';
import { Category, CategorySchema } from './schema/category.schema';
import { CategoryAttribute, CategoryAttributeSchema } from './schema/category-variants.schema';
import { CategoryAttributeValue, CategoryAttributeValueSchema } from './schema/category-attribute-values';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { ProductVariant, ProductVariantSchema } from './schema/product-variant.schema';
import { Media, MediaSchema } from 'src/document/schema/document.schema';
import { DocumentModule } from 'src/document/document.module';

@Module({
  imports:[MongooseModule.forFeature([{name:Product.name,schema:ProductSchema}]),MongooseModule.forFeature([{name:Category.name,schema:CategorySchema}]),MongooseModule.forFeature([{name:CategoryAttribute.name,schema:CategoryAttributeSchema}]),MongooseModule.forFeature([{name:CategoryAttributeValue.name,schema:CategoryAttributeValueSchema}]),MongooseModule.forFeature([{name:User.name,schema:UserSchema}]),MongooseModule.forFeature([{name:ProductVariant.name,schema:ProductVariantSchema}]),MongooseModule.forFeature([{name:Media.name,schema:MediaSchema}]),DocumentModule],
  providers: [ProductService],
  controllers: [ProductController],
  exports:[ProductService,MongooseModule]
})
export class ProductModule {}
