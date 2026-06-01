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
    @InjectConnection() private readonly connection: Connection,
  ) {}

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
}
