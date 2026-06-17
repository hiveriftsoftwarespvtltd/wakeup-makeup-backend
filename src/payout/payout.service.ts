import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { ApiResponse } from 'src/common/responses/api-response';
import {
  CommissionStatus,
  InfluencerCommission,
  InfluencerCommissionDocument,
} from 'src/influencer/schema/influencer-commision-rate.schema';
import {
  InfluencerCommissionSlabDocument,
  influencerCommissonSlab,
} from 'src/influencer/schema/influencer-commission-slab';
import {
  InfluencerPayout,
  InfluencerPayoutDocument,
  InfluencerPayoutStatus,
} from 'src/influencer/schema/influencer-payout.schema';
import {
  Influencer,
  InfluencerDocument,
} from 'src/influencer/schema/influencer.schema';
import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentStatus,
} from 'src/order/schema/order.schema';
import {
  VendorOrder,
  VendorOrderDocument,
} from 'src/order/schema/vendor-order.schema';
import {
  VendorPayout,
  VendorPayoutDocument,
  VendorPayoutStatus,
} from 'src/vendor/schema/vendor-payout.schema';
import { Vendor, VendorDocument } from 'src/vendor/schema/vendor.schema';
import { VendorWallet, VendorWalletDocument } from 'src/wallet/schema/vendor/vendor.wallet.schema';
import { VendorWalletTransaction, VendorWalletTransactionDocument, VendorWalletTransactionType, VendorWalletTransactionReason } from 'src/wallet/schema/vendor/vendor.wallet.transactions';
import { InfluencerWallet, InfluencerWalletDocument } from 'src/wallet/schema/influencer/influencer.wallet.schema';
import { InfluencerWalletTransaction, InfluencerWalletTransactionDocument, InfluencerWalletTransactionType, InfluencerWalletTransactionReason } from 'src/wallet/schema/influencer/influencer.wallet.transactions';
import { ServiceProviderWallet, ServiceProviderWalletDocument } from 'src/wallet/schema/service_provider/service_provider.wallet.schema';
import { ServiceProviderWalletTransaction, ServiceProviderWalletTransactionDocument, ServiceProviderWalletTransactionType, ServiceProviderWalletTransactionReason } from 'src/wallet/schema/service_provider/service_provider.wallet.transactions';
import { EducatorWallet, EducatorWalletDocument } from 'src/wallet/schema/educator/educator.wallet.schema';
import { EducatorWalletTransaction, EducatorWalletTransactionDocument, EducatorWalletTransactionType, EducatorWalletTransactionReason } from 'src/wallet/schema/educator/educator.wallet.transactions';
import { CoursePurchase, CoursePurchaseDocument } from 'src/courses/schema/course-purchase.schema';
import { ServiceBooking, ServiceBookingDocument } from 'src/service/schema/service-booking.schema';
import { PlatformWallet, PlatformWalletDocument } from 'src/wallet/schema/platform/platform.wallet.schema';
import { PlatformWalletTransaction, PlatformWalletTransactionDocument, PlatformWalletTransactionType, PlatformWalletTransactionReason, PlatformTransactionSourceType } from 'src/wallet/schema/platform/platform.wallet.transactions';

@Injectable()
export class PayoutService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(VendorOrder.name)
    private vendorOrderModel: Model<VendorOrderDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Influencer.name)
    private influencerModel: Model<InfluencerDocument>,
    @InjectModel(InfluencerCommission.name)
    private influencerCommissionModel: Model<InfluencerCommissionDocument>,
    @InjectModel(influencerCommissonSlab.name)
    private slabModel: Model<InfluencerCommissionSlabDocument>,
    @InjectModel(InfluencerPayout.name)
    private influencerPayoutModel: Model<InfluencerPayoutDocument>,
    @InjectModel(VendorPayout.name)
    private vendorPayoutModel: Model<VendorPayoutDocument>,
    @InjectModel(VendorWallet.name) private vendorWalletModel: Model<VendorWalletDocument>,
    @InjectModel(VendorWalletTransaction.name) private vendorWalletTransactionModel: Model<VendorWalletTransactionDocument>,
    @InjectModel(InfluencerWallet.name) private influencerWalletModel: Model<InfluencerWalletDocument>,
    @InjectModel(InfluencerWalletTransaction.name) private influencerWalletTransactionModel: Model<InfluencerWalletTransactionDocument>,
    @InjectModel(ServiceProviderWallet.name) private serviceProviderWalletModel: Model<ServiceProviderWalletDocument>,
    @InjectModel(ServiceProviderWalletTransaction.name) private serviceProviderWalletTransactionModel: Model<ServiceProviderWalletTransactionDocument>,
    @InjectModel(EducatorWallet.name) private educatorWalletModel: Model<EducatorWalletDocument>,
    @InjectModel(EducatorWalletTransaction.name) private educatorWalletTransactionModel: Model<EducatorWalletTransactionDocument>,
    @InjectModel(CoursePurchase.name) private coursePurchaseModel: Model<CoursePurchaseDocument>,
    @InjectModel(ServiceBooking.name) private serviceBookingModel: Model<ServiceBookingDocument>,
    @InjectModel(PlatformWallet.name) private platformWalletModel: Model<PlatformWalletDocument>,
    @InjectModel(PlatformWalletTransaction.name) private platformWalletTransactionModel: Model<PlatformWalletTransactionDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async updatePlatformWallet(
    amount: number,
    sourceId: Types.ObjectId,
    sourceType: PlatformTransactionSourceType,
    reason: PlatformWalletTransactionReason,
    description: string,
    session: any
  ) {
    if (amount <= 0) return;

    let wallet = await this.platformWalletModel.findOne().session(session);
    if (!wallet) {
      const wallets = await this.platformWalletModel.create([{}], { session });
      wallet = wallets[0];
    }

    wallet.balance += amount;
    if (reason === PlatformWalletTransactionReason.ORDER_COMMISSION || reason === PlatformWalletTransactionReason.BOOKING_COMMISSION) {
      wallet.totalCommissionEarned += amount;
    } else if (reason === PlatformWalletTransactionReason.PLATFORM_FEE) {
      wallet.totalPlatformFeesEarned += amount;
    }
    
    await wallet.save({ session });

    await this.platformWalletTransactionModel.create([{
      walletId: wallet._id,
      amount,
      type: PlatformWalletTransactionType.CREDIT,
      reason,
      sourceId,
      sourceType,
      description,
      balanceAfterTransaction: wallet.balance
    }], { session });
  }

  async settleVendorPayout(dto: {
    vendorId: string;
    vendorOrderIds: string[];
    transactionId: string;
    remarks?: string;
    month?: number;
    year?: number;
  }) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const month = dto.month || new Date().getMonth() + 1;

      const year = dto.year || new Date().getFullYear();

      const vendorOrders = await this.vendorOrderModel.find({
        _id: {
          $in: dto.vendorOrderIds.map((id: any) => new Types.ObjectId(id)),
        },

        vendorId: new Types.ObjectId(dto.vendorId),

        orderStatus: OrderStatus.DELIVERED,

        paymentStatus: PaymentStatus.PAID,

        isVendorSettled: false,
      });

      if (!vendorOrders.length) {
        throw new BadRequestException('No payable orders found');
      }

      const vendor = await this.vendorModel.findById(dto.vendorId);

      const totalOrders = vendorOrders.length;

      const totalSales = vendorOrders.reduce(
        (sum, item) => sum + item.grandTotal,
        0,
      );

      const totalCommission = vendorOrders.reduce(
        (sum, item) => sum + item.commissionAmount,
        0,
      );

      const totalInfluencerCommission = vendorOrders.reduce(
        (sum, item) => sum + item.influencerCommissionAmount,
        0,
      );

      const totalShippingDeduction = vendorOrders.reduce(
        (sum, item) => sum + item.shippingCharge + item.codCharge,
        0,
      );

      const netPayout = vendorOrders.reduce(
        (sum, item) => sum + item.payoutAmount,
        0,
      );

      const payout = await this.vendorPayoutModel.create(
        [
          {
            vendorId: vendor!._id,

            vendorUserId: vendor!.ownerId,

            vendorOrderIds: vendorOrders.map((o) => o._id),

            totalOrders,

            totalSales,

            totalCommission,

            totalInfluencerCommission,

            totalShippingDeduction,

            netPayout,

            payoutMonth: month,

            payoutYear: year,

            transactionId: dto.transactionId,

            remarks: dto.remarks,

            paidAt: new Date(),

            status: VendorPayoutStatus.PAID,
          },
        ],
        { session },
      );

      await this.vendorOrderModel.updateMany(
        {
          _id: {
            $in: vendorOrders.map((x) => x._id),
          },
        },
        {
          $set: {
            isVendorSettled: true,

            vendorSettledAt: new Date(),
          },
        },
        { session },
      );

      await session.commitTransaction();

      return ApiResponse.success('Vendor payout completed', payout[0]);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async settleInfluencerPayout(dto: {
    influencerId: string;
    commissionIds: string[];
    transactionId: string;
    remarks?: string;
    month?: number;
    year?: number;
  }) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const month = dto.month || new Date().getMonth() + 1;

      const year = dto.year || new Date().getFullYear();

      const commissions = await this.influencerCommissionModel.find({
        _id: {
          $in: dto.commissionIds.map((id) => new Types.ObjectId(id)),
        },

        influencerId: new Types.ObjectId(dto.influencerId),

        isDelivered: true,

        isSettled: false,
      });

      if (!commissions.length) {
        throw new BadRequestException('No commissions found');
      }

      const influencer = await this.influencerModel.findById(dto.influencerId);

      const totalSales = commissions.reduce(
        (sum, item) => sum + item.finalOrderAmount,
        0,
      );

      const slab = await this.slabModel
        .findOne({
          minSales: {
            $lte: totalSales,
          },
          maxSales: {
            $gte: totalSales,
          },
          isActive: true,
        })
        .lean();

      const rate = slab?.commissionRate || 0;

      const totalPlatformCommission = commissions.reduce(
        (sum, item) => sum + item.platformCommissionAmount,
        0,
      );

      const payoutAmount = Number(
        ((totalPlatformCommission * rate) / 100).toFixed(2),
      );

      const payout = await this.influencerPayoutModel.create(
        [
          {
            influencerId: influencer!._id,

            influencerUserId: influencer!.userId,

            totalOrders: commissions.length,

            totalSales,

            totalProfit: commissions.reduce(
              (sum, item) => sum + item.netProfit,
              0,
            ),

            commissionRate: rate,

            totalCommission: payoutAmount,

            payoutMonth: month,

            payoutYear: year,

            transactionId: dto.transactionId,

            remarks: dto.remarks,

            commissionIds: commissions.map((c) => c._id),

            settledAt: new Date(),

            paidAt: new Date(),

            status: InfluencerPayoutStatus.PAID,
          },
        ],
        { session },
      );

      await this.influencerCommissionModel.updateMany(
        {
          _id: {
            $in: commissions.map((c) => c._id),
          },
        },
        {
          $set: {
            isSettled: true,

            settledAt: new Date(),

            paidAt: new Date(),

            commissionRate: rate,

            commissionAmount: payoutAmount / commissions.length,

            status: CommissionStatus.PAID,
          },
        },
        { session },
      );

      await this.influencerModel.updateOne(
        {
          _id: influencer!._id,
        },
        {
          $inc: {
            paidCommission: payoutAmount,

            pendingCommission: -payoutAmount,
          },
        },
        { session },
      );

      await session.commitTransaction();

      return ApiResponse.success('Influencer payout completed', payout[0]);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async settleVendorPendingBalance(dto: { vendorId: string; vendorOrderIds: string[] }) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const vendorOrders = await this.vendorOrderModel.find({
        _id: { $in: dto.vendorOrderIds.map(id => new Types.ObjectId(id)) },
        vendorId: new Types.ObjectId(dto.vendorId),
        isVendorSettled: false,
      }).session(session);

      if (!vendorOrders.length) throw new BadRequestException('No unsettled orders found');

      const totalAmount = vendorOrders.reduce((sum, item) => sum + item.payoutAmount, 0);
      const totalPlatformCommission = vendorOrders.reduce((sum, item) => sum + (item.platformCommissionAmount || 0), 0);

      const wallet = await this.vendorWalletModel.findOne({ vendorId: new Types.ObjectId(dto.vendorId) }).session(session);
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.pendingBalance < totalAmount) throw new BadRequestException('Insufficient pending balance');

      wallet.pendingBalance -= totalAmount;
      wallet.balance += totalAmount;
      wallet.totalEarnings += totalAmount;
      await wallet.save({ session });

      await this.vendorOrderModel.updateMany(
        { _id: { $in: vendorOrders.map(o => o._id) } },
        { $set: { isVendorSettled: true, vendorSettledAt: new Date() } },
        { session }
      );

      await this.vendorWalletTransactionModel.create([{
        walletId: wallet._id,
        vendorId: wallet.vendorId,
        amount: totalAmount,
        type: VendorWalletTransactionType.CREDIT,
        reason: VendorWalletTransactionReason.ADMIN_ADJUSTMENT,
        description: `Settled pending balance for ${vendorOrders.length} orders`,
        balanceAfterTransaction: wallet.balance,
      }], { session });

      if (totalPlatformCommission > 0) {
        await this.updatePlatformWallet(
          totalPlatformCommission,
          vendorOrders[0]._id, // using first order as reference
          PlatformTransactionSourceType.ORDER,
          PlatformWalletTransactionReason.PLATFORM_FEE,
          `Platform fee for ${vendorOrders.length} vendor orders`,
          session
        );
      }

      await session.commitTransaction();
      return ApiResponse.success('Vendor pending balance settled successfully', wallet);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async settleInfluencerPendingBalance(dto: { influencerId: string; commissionIds: string[] }) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const commissions = await this.influencerCommissionModel.find({
        _id: { $in: dto.commissionIds.map(id => new Types.ObjectId(id)) },
        influencerId: new Types.ObjectId(dto.influencerId),
        isSettled: false,
      }).session(session);

      if (!commissions.length) throw new BadRequestException('No unsettled commissions found');

      const totalSales = commissions.reduce((sum, item) => sum + item.finalOrderAmount, 0);

      const slab = await this.slabModel.findOne({
        minSales: { $lte: totalSales },
        maxSales: { $gte: totalSales },
        isActive: true,
      }).lean().session(session);

      const rate = slab?.commissionRate || 0;

      const totalPlatformCommission = commissions.reduce(
        (sum, item) => sum + item.platformCommissionAmount,
        0,
      );

      const originalTotalNetProfit = commissions.reduce((sum, item) => sum + item.netProfit, 0);
      const payoutAmount = rate > 0 ? Number(((totalPlatformCommission * rate) / 100).toFixed(2)) : 0;
      const platformFee = rate > 0 ? (totalPlatformCommission - payoutAmount) : totalPlatformCommission;

      const wallet = await this.influencerWalletModel.findOne({ influencerId: new Types.ObjectId(dto.influencerId) }).session(session);
      if (!wallet) throw new BadRequestException('Wallet not found');

      // The pending balance for these commissions was originally `netProfit`. We should deduct what we put in originally.
      wallet.pendingBalance -= originalTotalNetProfit;

      if (payoutAmount > 0) {
        wallet.balance += payoutAmount;
        wallet.totalEarnings += payoutAmount;
      }
      
      await wallet.save({ session });

      await this.influencerCommissionModel.updateMany(
        { _id: { $in: commissions.map(c => c._id) } },
        { $set: { isSettled: true, settledAt: new Date() } },
        { session }
      );

      if (payoutAmount > 0) {
        await this.influencerWalletTransactionModel.create([{
          walletId: wallet._id,
          influencerId: wallet.influencerId,
          amount: payoutAmount,
          type: InfluencerWalletTransactionType.CREDIT,
          reason: InfluencerWalletTransactionReason.ADMIN_ADJUSTMENT,
          description: `Settled pending balance for ${commissions.length} commissions at ${rate}% slab`,
          balanceAfterTransaction: wallet.balance,
        }], { session });
      }

      if (platformFee > 0) {
        await this.updatePlatformWallet(
          platformFee,
          commissions[0]._id, // using first commission as reference
          PlatformTransactionSourceType.ORDER,
          PlatformWalletTransactionReason.PLATFORM_FEE,
          `Platform fee for ${commissions.length} influencer commissions`,
          session
        );
      }

      await session.commitTransaction();
      return ApiResponse.success('Influencer pending balance settled successfully', wallet);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async settleServiceProviderPendingBalance(dto: { serviceProviderId: string; serviceBookingIds: string[] }) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const bookings = await this.serviceBookingModel.find({
        _id: { $in: dto.serviceBookingIds.map(id => new Types.ObjectId(id)) },
        serviceProviderId: new Types.ObjectId(dto.serviceProviderId),
        isSettled: false,
      }).session(session);

      if (!bookings.length) throw new BadRequestException('No unsettled bookings found');

      // Assume payoutAmount is totalAmount - platformCommission
      const totalAmount = bookings.reduce((sum, item) => sum + (item as any).payoutAmount || 0, 0);
      const totalPlatformCommission = bookings.reduce((sum, item) => sum + ((item as any).platformCommissionAmount || 0), 0);

      const wallet = await this.serviceProviderWalletModel.findOne({ serviceProviderId: new Types.ObjectId(dto.serviceProviderId) }).session(session);
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.pendingBalance < totalAmount) throw new BadRequestException('Insufficient pending balance');

      wallet.pendingBalance -= totalAmount;
      wallet.balance += totalAmount;
      wallet.totalEarnings += totalAmount;
      await wallet.save({ session });

      await this.serviceBookingModel.updateMany(
        { _id: { $in: bookings.map(b => b._id) } },
        { $set: { isSettled: true } }, // assuming isSettled is the field
        { session }
      );

      await this.serviceProviderWalletTransactionModel.create([{
        walletId: wallet._id,
        serviceProviderId: wallet.serviceProviderId,
        amount: totalAmount,
        type: ServiceProviderWalletTransactionType.CREDIT,
        reason: ServiceProviderWalletTransactionReason.ADMIN_ADJUSTMENT,
        description: `Settled pending balance for ${bookings.length} bookings`,
        balanceAfterTransaction: wallet.balance,
      }], { session });

      if (totalPlatformCommission > 0) {
        await this.updatePlatformWallet(
          totalPlatformCommission,
          bookings[0]._id, // using first booking as reference
          PlatformTransactionSourceType.BOOKING,
          PlatformWalletTransactionReason.BOOKING_COMMISSION,
          `Platform commission for ${bookings.length} service bookings`,
          session
        );
      }

      await session.commitTransaction();
      return ApiResponse.success('Service Provider pending balance settled successfully', wallet);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async settleEducatorPendingBalance(dto: { educatorId: string; coursePurchaseIds: string[] }) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const purchases = await this.coursePurchaseModel.find({
        _id: { $in: dto.coursePurchaseIds.map(id => new Types.ObjectId(id)) },
        isSettled: false,
      }).session(session);

      if (!purchases.length) throw new BadRequestException('No unsettled course purchases found');

      const totalAmount = purchases.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalPlatformCommission = purchases.reduce((sum, item) => sum + (item.platformCommissionAmount || 0), 0);
      const totalEducatorEarnings = totalAmount - totalPlatformCommission;

      const wallet = await this.educatorWalletModel.findOne({ educatorId: new Types.ObjectId(dto.educatorId) }).session(session);
      if (!wallet) throw new BadRequestException('Wallet not found');
      // pendingBalance should contain the full earnings we added when course purchased
      // wait, `course-enrollment.service.ts` originally added educatorEarnings to educator wallet directly as pendingBalance
      if (wallet.pendingBalance < totalEducatorEarnings) throw new BadRequestException('Insufficient pending balance');

      wallet.pendingBalance -= totalEducatorEarnings;
      wallet.balance += totalEducatorEarnings;
      wallet.totalEarnings += totalEducatorEarnings;
      await wallet.save({ session });

      await this.coursePurchaseModel.updateMany(
        { _id: { $in: purchases.map(p => p._id) } },
        { $set: { isSettled: true } },
        { session }
      );

      await this.educatorWalletTransactionModel.create([{
        walletId: wallet._id,
        educatorId: wallet.educatorId,
        amount: totalEducatorEarnings,
        type: EducatorWalletTransactionType.CREDIT,
        reason: EducatorWalletTransactionReason.ADMIN_ADJUSTMENT,
        description: `Settled pending balance for ${purchases.length} purchases`,
        balanceAfterTransaction: wallet.balance,
      }], { session });

      if (totalPlatformCommission > 0) {
        await this.updatePlatformWallet(
          totalPlatformCommission,
          purchases[0]._id, // using first purchase as reference
          PlatformTransactionSourceType.ORDER,
          PlatformWalletTransactionReason.PLATFORM_FEE,
          `Platform fee for ${purchases.length} course purchases`,
          session
        );
      }

      await session.commitTransaction();
      return ApiResponse.success('Educator pending balance settled successfully', wallet);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
