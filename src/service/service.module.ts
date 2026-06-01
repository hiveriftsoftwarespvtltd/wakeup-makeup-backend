import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
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
    ]),
  ],
  controllers: [ServiceController],
  providers: [ServiceService],
})
export class ServiceModule {}
