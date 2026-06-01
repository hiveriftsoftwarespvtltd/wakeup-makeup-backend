import { Module } from '@nestjs/common';

import { UserReview, UserReviewSchema } from './schema/user-review.schema';
import { ReviewController } from './user-review.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewService } from './user-review.service';
import { Product, ProductSchema } from 'src/product/schema/product.schema';
import { Vendor, VendorSchema } from 'src/vendor/schema/vendor.schema';
import { VendorOrder, VendorOrderSchema } from 'src/order/schema/vendor-order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserReview.name, schema: UserReviewSchema },
    ]),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: Vendor.name, schema: VendorSchema }]),
    MongooseModule.forFeature([{name:VendorOrder.name,schema:VendorOrderSchema}])
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class UserReviewModule {}
