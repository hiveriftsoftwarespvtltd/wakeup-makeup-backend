import { Module } from '@nestjs/common';
import { PayoutService } from './payout.service';
import { PayoutController } from './payout.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Vendor, VendorSchema } from 'src/vendor/schema/vendor.schema';
import { VendorPayout, VendorPayoutSchema } from 'src/vendor/schema/vendor-payout.schema';
import { Influencer, InfluencerSchema } from 'src/influencer/schema/influencer.schema';
import { InfluencerPayout, InfluencerPayoutSchema } from 'src/influencer/schema/influencer-payout.schema';
import { InfluencerCommission, InfluencerCommissionSchema } from 'src/influencer/schema/influencer-commision-rate.schema';
import { influencerCommissionSlabSchema, influencerCommissonSlab } from 'src/influencer/schema/influencer-commission-slab';
import { Order, OrderSchema } from 'src/order/schema/order.schema';
import { VendorOrder, VendorOrderSchema } from 'src/order/schema/vendor-order.schema';


@Module({
  imports:[MongooseModule.forFeature([{name:Vendor.name,schema:VendorSchema},{name:Influencer.name,schema:InfluencerSchema},{name:VendorPayout.name,schema:VendorPayoutSchema},{name:InfluencerPayout.name,schema:InfluencerPayoutSchema},{name:InfluencerCommission.name,schema:InfluencerCommissionSchema},{name:influencerCommissonSlab.name,schema:influencerCommissionSlabSchema},{name:Order.name,schema:OrderSchema},{name:VendorOrder.name,schema:VendorOrderSchema}])],
  providers: [PayoutService],
  controllers: [PayoutController]
})
export class PayoutModule {}
