import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, cartSchema } from './schema/cart.schema';
import { Product, ProductSchema } from 'src/product/schema/product.schema';
import { ProductVariant, ProductVariantSchema } from 'src/product/schema/product-variant.schema';

@Module({
  imports:[MongooseModule.forFeature([{name:Cart.name,schema:cartSchema}]),MongooseModule.forFeature([{name:Product.name,schema:ProductSchema}]),MongooseModule.forFeature([{name:ProductVariant.name,schema:ProductVariantSchema}])],
  controllers: [CartController],
  providers: [CartService]
})
export class CartModule {}
