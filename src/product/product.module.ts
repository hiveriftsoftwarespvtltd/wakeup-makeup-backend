import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schema/product.schema';
import { Category, CategorySchema } from './schema/category.schema';
import { CategoryAttribute, CategoryAttributeSchema } from './schema/category-variants.schema';
import { CategoryAttributeValue, CategoryAttributeValueSchema } from './schema/category-attribute-values';

@Module({
  imports:[MongooseModule.forFeature([{name:Product.name,schema:ProductSchema}]),MongooseModule.forFeature([{name:Category.name,schema:CategorySchema}]),MongooseModule.forFeature([{name:CategoryAttribute.name,schema:CategoryAttributeSchema}]),MongooseModule.forFeature([{name:CategoryAttributeValue.name,schema:CategoryAttributeValueSchema}])],
  providers: [ProductService],
  controllers: [ProductController]
})
export class ProductModule {}
