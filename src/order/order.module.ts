import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schema/order.schema';
import { Product, ProductSchema } from 'src/product/schema/product.schema';
import { ProductVariant, ProductVariantSchema } from 'src/product/schema/product-variant.schema';
import { Address, AddressSchema } from 'src/address/schema/address.schema';
import { Coupon, CouponSchema } from 'src/coupon/schema/coupon.schema';
import { Influencer, InfluencerSchema } from 'src/influencer/schema/influencer.schema';

@Module({
  imports:[MongooseModule.forFeature([{name:Order.name,schema:OrderSchema}]),MongooseModule.forFeature([{name:Product.name,schema:ProductSchema}]),MongooseModule.forFeature([{name:ProductVariant.name,schema:ProductVariantSchema}]),MongooseModule.forFeature([{name:Address.name,schema:AddressSchema}]),MongooseModule.forFeature([{name:Coupon.name,schema:CouponSchema}]),MongooseModule.forFeature([{name:Influencer.name,schema:InfluencerSchema}])],
  controllers: [OrderController],
  providers: [OrderService],
  exports:[OrderService,MongooseModule]
})
export class OrderModule {}
