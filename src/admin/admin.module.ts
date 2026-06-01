import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Vendor, VendorSchema } from 'src/vendor/schema/vendor.schema';
import { Mongoose } from 'mongoose';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Category, CategorySchema } from 'src/product/schema/category.schema';
import { Product, ProductSchema } from 'src/product/schema/product.schema';
import { DocumentModule } from 'src/document/document.module';
import {
  ProductVariant,
  ProductVariantSchema,
} from 'src/product/schema/product-variant.schema';
import { Order, OrderSchema } from 'src/order/schema/order.schema';
import { VendorOrder } from 'src/order/schema/vendor-order.schema';
import {
  InfluencerCommission,
  InfluencerCommissionSchema,
} from 'src/influencer/schema/influencer-commision-rate.schema';
import {
  VendorPayout,
  VendorPayoutSchema,
} from 'src/vendor/schema/vendor-payout.schema';
import { AdminDashboardService } from './admin.dashboard.service';
import { AdminDashboardController } from './admin.dashboard.controller';
import {
  Influencer,
  InfluencerSchema,
} from 'src/influencer/schema/influencer.schema';
import { AdminPublicController } from './admin.public.controllers';
import { InfluencerModule } from 'src/influencer/influencer.module';
import { influencerCommissionSlabSchema, influencerCommissonSlab } from 'src/influencer/schema/influencer-commission-slab';
import { InfluencerPayout, InfluencerPayoutSchema } from 'src/influencer/schema/influencer-payout.schema';
import { InfluencerInvitation, InfluencerInvitationSchema } from 'src/influencer/schema/influencer-invitation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vendor.name, schema: VendorSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
    ]),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([
      { name: ProductVariant.name, schema: ProductVariantSchema },
    ]),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    MongooseModule.forFeature([
      { name: VendorOrder.name, schema: VendorSchema },
    ]),
    MongooseModule.forFeature([
      { name: InfluencerCommission.name, schema: InfluencerCommissionSchema },
    ]),
    MongooseModule.forFeature([
      { name: Influencer.name, schema: InfluencerSchema },
    ]),
    MongooseModule.forFeature([
      { name: VendorPayout.name, schema: VendorPayoutSchema },
    ]),
    MongooseModule.forFeature([{name:influencerCommissonSlab.name,schema:influencerCommissionSlabSchema}]),
    MongooseModule.forFeature([{name:InfluencerPayout.name,schema:InfluencerPayoutSchema},{name:InfluencerInvitation.name,schema:InfluencerInvitationSchema}]),
    DocumentModule,
    InfluencerModule,
  ],
  providers: [AdminService, AdminDashboardService],
  controllers: [
    AdminController,
    AdminDashboardController,
    AdminPublicController,
  ],
})
export class AdminModule {}
