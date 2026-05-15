import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Vendor, VendorSchema } from './schema/vendor.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { DocumentModule } from 'src/document/document.module';
import { Product, ProductSchema } from 'src/product/schema/product.schema';
import { Category, CategorySchema } from 'src/product/schema/category.schema';
import { ProductVariant, ProductVariantSchema } from 'src/product/schema/product-variant.schema';
import { Order, OrderSchema } from 'src/order/schema/order.schema';

@Module({
  imports:[MongooseModule.forFeature([{name:Vendor.name,schema:VendorSchema}]),MongooseModule.forFeature([{name:User.name,schema:UserSchema}]),MongooseModule.forFeature([{name:Product.name,schema:ProductSchema}]),MongooseModule.forFeature([{name:Category.name,schema:CategorySchema}]),MongooseModule.forFeature([{name:ProductVariant.name,schema:ProductVariantSchema}]),MongooseModule.forFeature([{name:Order.name,schema:OrderSchema}]),DocumentModule],
  providers: [VendorService],
  controllers: [VendorController]
})
export class VendorModule {}
