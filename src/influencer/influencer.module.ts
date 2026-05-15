import { Module } from '@nestjs/common';
import { InfluencerController } from './influencer.controller';
import { InfluencerService } from './influencer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Influencer, InfluencerSchema } from './schema/influencer.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Coupon, CouponSchema } from 'src/coupon/schema/coupon.schema';

@Module({
  imports:[MongooseModule.forFeature([{name:Influencer.name,schema:InfluencerSchema}]),MongooseModule.forFeature([{name:User.name,schema:UserSchema}]),MongooseModule.forFeature([{name:Coupon.name,schema:CouponSchema}])],
  controllers: [InfluencerController],
  providers: [InfluencerService],
  exports:[InfluencerService,MongooseModule]
})
export class InfluencerModule {}
