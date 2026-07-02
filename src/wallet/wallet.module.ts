import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// User
import { UserWalletController } from './controller/user/user.wallet.controller';
import { UserWalletService } from './service/user/user.wallet.service';
import { UserWallet, UserWalletSchema } from './schema/user/user.wallet.schema';
import { WalletTransaction, WalletTransactionSchema } from './schema/user/user.wallet.transactions';
import { UserWalletTopup, UserWalletTopupSchema } from './schema/user/user.wallet.topup.schema';

// Service Provider
import { ServiceProviderWalletController } from './controller/service_provider/service_provider.wallet.controller';
import { ServiceProviderWalletService } from './service/service_provider/service_provider.wallet.service';
import { ServiceProviderWallet, ServiceProviderWalletSchema } from './schema/service_provider/service_provider.wallet.schema';
import { ServiceProviderWalletTransaction, ServiceProviderWalletTransactionSchema } from './schema/service_provider/service_provider.wallet.transactions';
import { ServiceProviderWalletWithdraw, ServiceProviderWalletWithdrawSchema } from './schema/service_provider/service_provider.wallet.withdraw.schema';

// Vendor
import { VendorWalletController } from './controller/vendor/vendor.wallet.controller';
import { VendorWalletService } from './service/vendor/vendor.wallet.service';
import { VendorWallet, VendorWalletSchema } from './schema/vendor/vendor.wallet.schema';
import { VendorWalletTransaction, VendorWalletTransactionSchema } from './schema/vendor/vendor.wallet.transactions';
import { VendorWalletWithdraw, VendorWalletWithdrawSchema } from './schema/vendor/vendor.wallet.withdraw.schema';

// Influencer
import { InfluencerWalletController } from './controller/influencer/influencer.wallet.controller';
import { InfluencerWalletService } from './service/influencer/influencer.wallet.service';
import { InfluencerWallet, InfluencerWalletSchema } from './schema/influencer/influencer.wallet.schema';
import { InfluencerWalletTransaction, InfluencerWalletTransactionSchema } from './schema/influencer/influencer.wallet.transactions';
import { InfluencerWalletWithdraw, InfluencerWalletWithdrawSchema } from './schema/influencer/influencer.wallet.withdraw.schema';

// Distributor
import { DistributorWalletController } from './controller/distributor/distributor.wallet.controller';
import { DistributorWalletService } from './service/distributor/distributor.wallet.service';
import { DistributorWallet, DistributorWalletSchema } from './schema/distributor/distributor.wallet.schema';
import { DistributorWalletTransaction, DistributorWalletTransactionSchema } from './schema/distributor/distributor.wallet.transactions';
import { DistributorWalletWithdraw, DistributorWalletWithdrawSchema } from './schema/distributor/distributor.wallet.withdraw.schema';

// Platform
import { PlatformWalletController } from './controller/platform/platform.wallet.controller';
import { PlatformWalletService } from './service/platform/platform.wallet.service';
import { PlatformWallet, PlatformWalletSchema } from './schema/platform/platform.wallet.schema';
import { PlatformWalletTransaction, PlatformWalletTransactionSchema } from './schema/platform/platform.wallet.transactions';

// Educator
import { EducatorWalletController } from './controller/educator/educator.wallet.controller';
import { EducatorWalletService } from './service/educator/educator.wallet.service';
import { EducatorWallet, EducatorWalletSchema } from './schema/educator/educator.wallet.schema';
import { EducatorWalletTransaction, EducatorWalletTransactionSchema } from './schema/educator/educator.wallet.transactions';
import { EducatorWalletWithdraw, EducatorWalletWithdrawSchema } from './schema/educator/educator.wallet.withdraw.schema';

// Admin
import { AdminWalletController } from './controller/admin/admin.wallet.controller';
import { AdminWalletService } from './service/admin/admin.wallet.service';
import { AdminCashbackSlabController } from './controller/admin/admin.cashback-slab.controller';
import { AdminCashbackSlabService } from './service/admin/admin.cashback-slab.service';
import { CashbackSlab, CashbackSlabSchema } from './schema/cashback/cashbacks.slabs.schema';

// Entity Collections for Sync
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Vendor, VendorSchema } from 'src/vendor/schema/vendor.schema';
import { Influencer, InfluencerSchema } from 'src/influencer/schema/influencer.schema';
import { ServiceProvider, ServiceProviderSchema } from 'src/service/schema/service-provider.schema';
import { Educator, EducatorSchema } from 'src/courses/schema/educator.schema';
import { AdminModule } from 'src/admin/admin.module';
import { Admin } from 'openai/resources';
import { AdminSchema } from 'src/admin/schema/admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserWallet.name, schema: UserWalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: UserWalletTopup.name, schema: UserWalletTopupSchema },

      { name: ServiceProviderWallet.name, schema: ServiceProviderWalletSchema },
      { name: ServiceProviderWalletTransaction.name, schema: ServiceProviderWalletTransactionSchema },
      { name: ServiceProviderWalletWithdraw.name, schema: ServiceProviderWalletWithdrawSchema },

      { name: VendorWallet.name, schema: VendorWalletSchema },
      { name: VendorWalletTransaction.name, schema: VendorWalletTransactionSchema },
      { name: VendorWalletWithdraw.name, schema: VendorWalletWithdrawSchema },

      { name: InfluencerWallet.name, schema: InfluencerWalletSchema },
      { name: InfluencerWalletTransaction.name, schema: InfluencerWalletTransactionSchema },
      { name: InfluencerWalletWithdraw.name, schema: InfluencerWalletWithdrawSchema },

      { name: DistributorWallet.name, schema: DistributorWalletSchema },
      { name: DistributorWalletTransaction.name, schema: DistributorWalletTransactionSchema },
      { name: DistributorWalletWithdraw.name, schema: DistributorWalletWithdrawSchema },

      { name: PlatformWallet.name, schema: PlatformWalletSchema },
      { name: PlatformWalletTransaction.name, schema: PlatformWalletTransactionSchema },

      { name: EducatorWallet.name, schema: EducatorWalletSchema },
      { name: EducatorWalletTransaction.name, schema: EducatorWalletTransactionSchema },
      { name: EducatorWalletWithdraw.name, schema: EducatorWalletWithdrawSchema },

      // Entity Collections for Syncing
      { name: User.name, schema: UserSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Influencer.name, schema: InfluencerSchema },
      { name: ServiceProvider.name, schema: ServiceProviderSchema },
      { name: Educator.name, schema: EducatorSchema },

      // Cashback
      { name: CashbackSlab.name, schema: CashbackSlabSchema },
      { name: Admin.name, schema: AdminSchema }

    ]),
    
  ],
  controllers: [
    UserWalletController,
    ServiceProviderWalletController,
    VendorWalletController,
    InfluencerWalletController,
    DistributorWalletController,
    EducatorWalletController,
    PlatformWalletController,
    AdminWalletController,
    AdminCashbackSlabController,

  ],
  providers: [
    UserWalletService,
    ServiceProviderWalletService,
    VendorWalletService,
    InfluencerWalletService,
    DistributorWalletService,
    PlatformWalletService,
    EducatorWalletService,
    AdminWalletService,
    AdminCashbackSlabService,
  ],
  exports: [
    UserWalletService,
    VendorWalletService,
    ServiceProviderWalletService,
    InfluencerWalletService,
    EducatorWalletService,
  ]
})
export class WalletModule { }
