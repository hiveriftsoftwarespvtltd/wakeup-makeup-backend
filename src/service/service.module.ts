import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { ServiceSearchController } from './service-search.controller';
import { ServiceSearchService } from './service-search.service';
import { ServiceBookingController } from './service-booking.controller';
import { ServiceBookingService } from './service-booking.service';
import { ServiceLeadController } from './service-lead.controller';
import { ServiceLeadService } from './service-lead.service';
import {
  ProviderSubscription,
  ProviderSubscriptionSchema,
} from './schema/provider-subscription.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProviderAvailability,
  ProviderAvailabilitySchema,
} from './schema/service-availability.schema';
import {
  ServiceBooking,
  ServiceBookingSchema,
} from './schema/service-booking.schema';
import {
  ServiceCategory,
  ServiceCategorySchema,
} from './schema/service-category.schema';
import { ServiceLead, ServiceLeadSchema } from './schema/service-lead.schema';
import {
  ServiceProviderPayoutSchema,
  ServicerProviderPayout,
} from './schema/service-provider-payout.schema';
import {
  ServiceProviderWallet,
  ServiceProviderWalletSchema,
} from './schema/service-provider-wallet.schema';
import {
  ServiceProvider,
  ServiceProviderSchema,
} from './schema/service-provider.schema';
import {
  ServiceReview,
  ServiceReviewSchema,
} from './schema/service-review.schema';
import { ServcieSlotSchema, ServiceSlot } from './schema/service-slot.schema';
import {
  ServiceStaff,
  ServiceStaffSchema,
} from './schema/service-staff.schema';
import {
  ServiceSubscriptionPlan,
  ServiceSubscriptionPlanSchema,
} from './schema/service-subscription.schema';
import { Service, ServiceSchema } from './schema/service.schema';
import { DocumentModule } from 'src/document/document.module';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Coupon, CouponSchema } from 'src/coupon/schema/coupon.schema';
import { CouponUsage, CouponUsageSchema } from 'src/coupon/schema/coupon-usage.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProviderSubscription.name, schema: ProviderSubscriptionSchema },
      { name: ProviderAvailability.name, schema: ProviderAvailabilitySchema },
      { name: ServiceBooking.name, schema: ServiceBookingSchema },
      { name: ServiceCategory.name, schema: ServiceCategorySchema },
      { name: ServiceLead.name, schema: ServiceLeadSchema },
      {
        name: ServicerProviderPayout.name,
        schema: ServiceProviderPayoutSchema,
      },
      { name: ServiceProviderWallet.name, schema: ServiceProviderWalletSchema },
      { name: ServiceProvider.name, schema: ServiceProviderSchema },
      { name: ServiceReview.name, schema: ServiceReviewSchema },
      { name: ServiceSlot.name, schema: ServcieSlotSchema },
      { name: ServiceStaff.name, schema: ServiceStaffSchema },
      {
        name: ServiceSubscriptionPlan.name,
        schema: ServiceSubscriptionPlanSchema,
      },
      { name: Service.name, schema: ServiceSchema },
      { name: User.name, schema: UserSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: CouponUsage.name, schema: CouponUsageSchema },
    ]),
    DocumentModule,
  ],
  controllers: [ServiceController, ServiceSearchController, ServiceBookingController, ServiceLeadController],
  providers: [ServiceService, ServiceSearchService, ServiceBookingService, ServiceLeadService],
  exports: [ServiceService, ServiceSearchService, ServiceBookingService, ServiceLeadService, MongooseModule],
})
export class ServiceModule { }
