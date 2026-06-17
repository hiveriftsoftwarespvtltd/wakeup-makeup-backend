import { Module } from '@nestjs/common';
import { InfluencerController } from './influencer.controller';
import { InfluencerService } from './influencer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Influencer, InfluencerSchema } from './schema/influencer.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Coupon, CouponSchema } from 'src/coupon/schema/coupon.schema';
import { InfluencerCommission, InfluencerCommissionSchema } from './schema/influencer-commision-rate.schema';
import { Order, OrderSchema } from 'src/order/schema/order.schema';
import { influencerCommissionSlabSchema, influencerCommissonSlab } from './schema/influencer-commission-slab';
import { InfluencerPayout, InfluencerPayoutSchema } from './schema/influencer-payout.schema';
import { InfluencerInvitation, InfluencerInvitationSchema } from './schema/influencer-invitation.schema';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports:[MongooseModule.forFeature([{name:Influencer.name,schema:InfluencerSchema}]),MongooseModule.forFeature([{name:User.name,schema:UserSchema}]),MongooseModule.forFeature([{name:Coupon.name,schema:CouponSchema}]),MongooseModule.forFeature([{name:InfluencerCommission.name,schema:InfluencerCommissionSchema}]),MongooseModule.forFeature([{name:Order.name,schema:OrderSchema}]),MongooseModule.forFeature([{name:influencerCommissonSlab.name,schema:influencerCommissionSlabSchema}]),MongooseModule.forFeature([{name:InfluencerPayout.name,schema:InfluencerPayoutSchema},{name:InfluencerInvitation.name,schema:InfluencerInvitationSchema}]), WalletModule],
  controllers: [InfluencerController],
  providers: [InfluencerService],
  exports:[InfluencerService,MongooseModule]
})
export class InfluencerModule {}
