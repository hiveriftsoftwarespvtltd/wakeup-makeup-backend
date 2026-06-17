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
import { BankAccount, BankAccountSchema } from './schema/bank-account.schema';
import { VendorWalletWithdraw, VendorWalletWithdrawSchema } from 'src/wallet/schema/vendor/vendor.wallet.withdraw.schema';
import { InfluencerWalletWithdraw, InfluencerWalletWithdrawSchema } from 'src/wallet/schema/influencer/influencer.wallet.withdraw.schema';
import { ServiceProviderWalletWithdraw, ServiceProviderWalletWithdrawSchema } from 'src/wallet/schema/service_provider/service_provider.wallet.withdraw.schema';
import { EducatorWalletWithdraw, EducatorWalletWithdrawSchema } from 'src/wallet/schema/educator/educator.wallet.withdraw.schema';
import { BankAccountService } from './bank-account.service';
import { BankAccountController } from './bank-account.controller';
import { VendorWallet, VendorWalletSchema } from 'src/wallet/schema/vendor/vendor.wallet.schema';
import { VendorWalletTransaction, VendorWalletTransactionSchema } from 'src/wallet/schema/vendor/vendor.wallet.transactions';
import { InfluencerWallet, InfluencerWalletSchema } from 'src/wallet/schema/influencer/influencer.wallet.schema';
import { InfluencerWalletTransaction, InfluencerWalletTransactionSchema } from 'src/wallet/schema/influencer/influencer.wallet.transactions';
import { ServiceProviderWallet, ServiceProviderWalletSchema } from 'src/wallet/schema/service_provider/service_provider.wallet.schema';
import { ServiceProviderWalletTransaction, ServiceProviderWalletTransactionSchema } from 'src/wallet/schema/service_provider/service_provider.wallet.transactions';
import { EducatorWallet, EducatorWalletSchema } from 'src/wallet/schema/educator/educator.wallet.schema';
import { EducatorWalletTransaction, EducatorWalletTransactionSchema } from 'src/wallet/schema/educator/educator.wallet.transactions';
import { CoursePurchase, CoursePurchaseSchema } from 'src/courses/schema/course-purchase.schema';
import { ServiceBooking, ServiceBookingSchema } from 'src/service/schema/service-booking.schema';
import { PlatformWallet, PlatformWalletSchema } from 'src/wallet/schema/platform/platform.wallet.schema';
import { PlatformWalletTransaction, PlatformWalletTransactionSchema } from 'src/wallet/schema/platform/platform.wallet.transactions';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name:Vendor.name,schema:VendorSchema},
      {name:Influencer.name,schema:InfluencerSchema},
      {name:VendorPayout.name,schema:VendorPayoutSchema},
      {name:InfluencerPayout.name,schema:InfluencerPayoutSchema},
      {name:InfluencerCommission.name,schema:InfluencerCommissionSchema},
      {name:influencerCommissonSlab.name,schema:influencerCommissionSlabSchema},
      {name:Order.name,schema:OrderSchema},
      {name:VendorOrder.name,schema:VendorOrderSchema},
      {name:BankAccount.name,schema:BankAccountSchema},
      {name:VendorWalletWithdraw.name,schema:VendorWalletWithdrawSchema},
      {name:InfluencerWalletWithdraw.name,schema:InfluencerWalletWithdrawSchema},
      {name:ServiceProviderWalletWithdraw.name,schema:ServiceProviderWalletWithdrawSchema},
      {name:EducatorWalletWithdraw.name,schema:EducatorWalletWithdrawSchema},
      {name:VendorWallet.name,schema:VendorWalletSchema},
      {name:VendorWalletTransaction.name,schema:VendorWalletTransactionSchema},
      {name:InfluencerWallet.name,schema:InfluencerWalletSchema},
      {name:InfluencerWalletTransaction.name,schema:InfluencerWalletTransactionSchema},
      {name:ServiceProviderWallet.name,schema:ServiceProviderWalletSchema},
      {name:ServiceProviderWalletTransaction.name,schema:ServiceProviderWalletTransactionSchema},
      {name:EducatorWallet.name,schema:EducatorWalletSchema},
      {name:EducatorWalletTransaction.name,schema:EducatorWalletTransactionSchema},
      {name:CoursePurchase.name,schema:CoursePurchaseSchema},
      {name:ServiceBooking.name,schema:ServiceBookingSchema},
      {name:PlatformWallet.name,schema:PlatformWalletSchema},
      {name:PlatformWalletTransaction.name,schema:PlatformWalletTransactionSchema},
    ])
  ],
  providers: [PayoutService, BankAccountService],
  controllers: [PayoutController, BankAccountController]
})
export class PayoutModule {}
