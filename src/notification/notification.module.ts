import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { AdminNotificationController } from './admin.notification.controller';
import { NotificationService } from './notification.service';
import { Notification, NotificationSchema } from './schema/notification.schema';
import { NotificationCampaign, NotificationCampaignSchema } from './schema/notification.campaign.schema';
import { User, UserSchema } from '../user/schema/user.schema';
import { ServiceBooking, ServiceBookingSchema } from '../service/schema/service-booking.schema';
import { AdminModule } from 'src/admin/admin.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationCampaign.name, schema: NotificationCampaignSchema },
      { name: User.name, schema: UserSchema },
      { name: ServiceBooking.name, schema: ServiceBookingSchema },
    ]),
    AdminModule
  ],
  controllers: [NotificationController, AdminNotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule { }
