import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectConnection, InjectModel } from '@nestjs/mongoose';

import { Connection, Model, Types } from 'mongoose';

import {
  Order,
  OrderDocument,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from './schema/order.schema';

import { Product, ProductDocument } from '../product/schema/product.schema';

import {
  ProductVariant,
  ProductVariantDocument,
} from '../product/schema/product-variant.schema';

import { Address, AddressDocument } from '../address/schema/address.schema';

import {
  Coupon,
  CouponDocument,
  CouponScope,
  CouponType,
} from '../coupon/schema/coupon.schema';

import { ApiResponse } from 'src/common/responses/api-response';

import { CreateOrderDto, UpdateUserOrderDTO } from './dto/order.dto';
import {
  Influencer,
  InfluencerDocument,
} from 'src/influencer/schema/influencer.schema';
import {
  CouponUsage,
  CouponUsageDocument,
} from 'src/coupon/schema/coupon-usage.schema';
import {
  CommissionStatus,
  InfluencerCommission,
  InfluencerCommissionDocument,
} from 'src/influencer/schema/influencer-commision-rate.schema';
import {
  VendorPayout,
  VendorPayoutDocument,
} from 'src/vendor/schema/vendor-payout.schema';
import { Vendor, VendorDocument } from 'src/vendor/schema/vendor.schema';
import { VendorOrder, VendorOrderDocument } from './schema/vendor-order.schema';
import { ShiprocketService } from 'src/shiprocket/shiprocket.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(ProductVariant.name)
    private readonly variantModel: Model<ProductVariantDocument>,

    @InjectModel(Address.name)
    private readonly addressModel: Model<AddressDocument>,

    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,

    @InjectModel(Influencer.name)
    private readonly influencerModel: Model<InfluencerDocument>,

    @InjectModel(CouponUsage.name)
    private readonly couponUsageModel: Model<CouponUsageDocument>,

    @InjectModel(InfluencerCommission.name)
    private readonly influencerCommisionModel: Model<InfluencerCommissionDocument>,

    @InjectModel(VendorPayout.name)
    private readonly vendorPayoutModel: Model<VendorPayoutDocument>,

    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<VendorDocument>,

    @InjectModel(VendorOrder.name)
    private readonly vendorOrderModel: Model<VendorOrderDocument>,

    @InjectConnection()
    private readonly connection: Connection,

    private shiprocketService: ShiprocketService,
  ) {}

  // async placeOrder(dto: CreateOrderDto, userId: string) {
  //   const session = await this.connection.startSession();
  //   try {
  //     session.startTransaction();

  //     // ── 1. Validate address ───────────────────────────────────────────────
  //     const address = await this.addressModel
  //       .findOne({
  //         _id: new Types.ObjectId(dto.addressId),
  //         user: new Types.ObjectId(userId),
  //       })
  //       .session(session);

  //     if (!address) throw new NotFoundException('Address Not Found');
  //     if (!dto.items.length) throw new BadRequestException('No Items Found');

  //     // ── 2. Deduplicate variant IDs ────────────────────────────────────────
  //     const uniqueVariantIds = new Set<string>();
  //     for (const item of dto.items) {
  //       if (uniqueVariantIds.has(item.variantId)) {
  //         throw new BadRequestException('Duplicate variants are not allowed');
  //       }
  //       uniqueVariantIds.add(item.variantId);
  //     }

  //     // ── 3. Group items by vendor ──────────────────────────────────────────
  //     const vendorBuckets = new Map<
  //       string,
  //       // {
  //       //   vendor: VendorDocument;
  //       //   orderItems: Partial<OrderItem>[];
  //       //   variantsToUpdate: { variant: any; quantity: number }[];
  //       //   subTotal: number;
  //       // }
  //       {
  //         vendor: VendorDocument;
  //         orderItems: Partial<OrderItem>[];
  //         variantsToUpdate: { variant: any; quantity: number }[];
  //         subTotal: number;

  //         totalWeight: number;
  //         declaredValue: number;

  //         length: number;
  //         width: number;
  //         height: number;
  //       }
  //     >();

  //     for (const item of dto.items) {
  //       const product = await this.productModel
  //         .findById(item.productId)
  //         .session(session);
  //       if (!product) throw new NotFoundException('Product Not Found');

  //       const variant = await this.variantModel
  //         .findById(item.variantId)
  //         .session(session);
  //       if (!variant) throw new NotFoundException('Variant Not Found');
  //       // console.log("Product vendor id",product.vendorId)

  //       if (!product.vendorId)
  //         throw new BadRequestException('Vendor Not Found');

  //       if (
  //         !product.variants.some(
  //           (id) => id.toString() === variant._id.toString(),
  //         )
  //       ) {
  //         throw new BadRequestException('Variant does not belong to product');
  //       }

  //       if (variant.stock < item.quantity) {
  //         throw new BadRequestException(`${product.name} is out of stock`);
  //       }

  //       const vendorIdStr = product.vendorId.toString();

  //       if (!vendorBuckets.has(vendorIdStr)) {
  //         const vendor = await this.vendorModel
  //           .findById(product.vendorId)
  //           .session(session);
  //         // console.log("Product in line 170",product)
  //         if (!vendor) throw new NotFoundException('Vendor not found');

  //         vendorBuckets.set(vendorIdStr, {
  //           vendor,
  //           orderItems: [],
  //           variantsToUpdate: [],
  //           subTotal: 0,

  //           totalWeight: 0,
  //           declaredValue: 0,

  //           length: 0,
  //           width: 0,
  //           height: 0,
  //         });
  //       }

  //       const bucket = vendorBuckets.get(vendorIdStr)!;
  //       const totalPrice = variant.offeredPrice * item.quantity;
  //       bucket.subTotal += totalPrice;

  //       // bucket.subTotal += totalPrice;

  //       bucket.totalWeight += (variant.weight || 0.5) * item.quantity;

  //       bucket.declaredValue += totalPrice;

  //       bucket.length = Math.max(bucket.length, variant.length || 10);

  //       bucket.width = Math.max(bucket.width, variant.width || 10);

  //       bucket.height += (variant.height || 10) * item.quantity;

  //       bucket.orderItems.push({
  //         productId: product._id,
  //         variantId: variant._id,
  //         vendorId: product.vendorId,
  //         productName: product.name,
  //         sku: variant.sku,
  //         attributes: variant.attributes || {},
  //         quantity: item.quantity,
  //         offeredPrice: variant.offeredPrice || 0,
  //         salesPrice: variant.salesPrice || 0,
  //         costPrice: variant.costPrice || 0,
  //         totalPrice,
  //         weight: variant.weight,
  //         length: variant.length,
  //         width: variant.width,
  //         height: variant.height,
  //       });

  //       bucket.variantsToUpdate.push({ variant, quantity: item.quantity });
  //     }

  //     // ── 4. Resolve coupon ─────────────────────────────────────────────────
  //     let coupon: CouponDocument | null = null;
  //     let influencer: InfluencerDocument | null = null;

  //     if (dto.couponCode) {
  //       coupon = await this.couponModel.findOne({
  //         code: dto.couponCode.trim().toUpperCase(),
  //         isActive: true,
  //       });
  //       if (!coupon) throw new BadRequestException('Invalid Coupon');

  //       if (coupon.scope === CouponScope.VENDOR && coupon.vendorId) {
  //         if (!vendorBuckets.has(coupon.vendorId.toString())) {
  //           throw new BadRequestException(
  //             'Coupon not applicable for any product in your cart',
  //           );
  //         }
  //       }

  //       const now = new Date();
  //       if (coupon.startsAt && now < coupon.startsAt)
  //         throw new BadRequestException('Coupon not started yet');
  //       if (coupon.expiresAt && now > coupon.expiresAt)
  //         throw new BadRequestException('Coupon expired');
  //       if (
  //         coupon.totalUsageLimit &&
  //         coupon.totalUsed >= coupon.totalUsageLimit
  //       )
  //         throw new BadRequestException('Coupon Usage Limit Exceeded');

  //       const userCouponUsage = await this.couponUsageModel.countDocuments({
  //         couponId: coupon._id,
  //         userId: new Types.ObjectId(userId),
  //       });
  //       if (
  //         coupon.usageLimitPerUser &&
  //         userCouponUsage >= coupon.usageLimitPerUser
  //       )
  //         throw new BadRequestException('Coupon limit reached for this user');

  //       if (coupon.influencerId) {
  //         influencer = await this.influencerModel.findById(coupon.influencerId);
  //         if (!influencer) throw new NotFoundException('Influencer not found');
  //       }
  //     }

  //     // ── 5. Per-vendor financials + VendorOrder creation ───────────────────
  //     const shippingCharge = 100;
  //     const tax = 100;

  //     let orderGrandTotal = 0;
  //     let orderSubTotal = 0;
  //     let orderDiscount = 0;

  //     const vendorOrderIds: Types.ObjectId[] = [];
  //     const vendorPayoutIds: Types.ObjectId[] = []; // ← track for safe back-fill
  //     const orderNumber = `ORD-${Date.now()}`;
  //     let appliedCouponSnapshot: any = null;

  //     for (const [vendorIdStr, bucket] of vendorBuckets) {
  //       const { vendor, orderItems, variantsToUpdate, subTotal } = bucket;

  //       // 5a. Discount allocation
  //       let vendorDiscount = 0;
  //       if (coupon) {
  //         const isApplicable =
  //           coupon.scope !== CouponScope.VENDOR ||
  //           coupon.vendorId?.toString() === vendorIdStr;

  //         if (isApplicable) {
  //           if (
  //             !coupon.minimumOrderAmount ||
  //             subTotal >= coupon.minimumOrderAmount
  //           ) {
  //             if (coupon.type === CouponType.PERCENTAGE) {
  //               vendorDiscount = (subTotal * coupon.value) / 100;
  //               if (
  //                 coupon.maximumDiscount &&
  //                 vendorDiscount > coupon.maximumDiscount
  //               ) {
  //                 vendorDiscount = coupon.maximumDiscount;
  //               }
  //             } else {
  //               const totalSubTotal = [...vendorBuckets.values()].reduce(
  //                 (s, b) => s + b.subTotal,
  //                 0,
  //               );
  //               vendorDiscount = (subTotal / totalSubTotal) * coupon.value;
  //             }
  //           }
  //         }
  //       }

  //       // 5b. Allocate discount to items
  //       for (const oi of orderItems) {
  //         if (vendorDiscount > 0) {
  //           oi.discountAmount = parseFloat(
  //             ((oi.totalPrice! / subTotal) * vendorDiscount).toFixed(2),
  //           );
  //         } else {
  //           oi.discountAmount = 0;
  //         }
  //         oi.finalPrice = parseFloat(
  //           (oi.totalPrice! - oi.discountAmount).toFixed(2),
  //         );
  //       }

  //       // 5c. Commission + payout
  //       const platformCommissionRate = vendor.commissionRate || 0;
  //       const finalOrderAmount = subTotal - vendorDiscount;
  //       const platformCommissionAmount =
  //         (finalOrderAmount * platformCommissionRate) / 100;
  //       const vendorPayoutAmount = finalOrderAmount - platformCommissionAmount;

  //       let influencerCommissionRate = 0;
  //       let influencerCommissionAmount = 0;
  //       if (influencer && coupon?.influencerId) {
  //         // influencerCommissionRate = influencer.commissionRate || 0;
  //         influencerCommissionAmount =
  //           (vendorDiscount * influencerCommissionRate) / 100;
  //       }

  //       const vendorGrandTotal =
  //         subTotal - vendorDiscount + shippingCharge + tax;

  //       // 5d. Coupon snapshot
  //       if (coupon && vendorDiscount > 0) {
  //         appliedCouponSnapshot = {
  //           code: coupon.code,
  //           couponId: coupon._id,
  //           scope: coupon.scope,
  //           couponType: coupon.type,
  //           couponValue: coupon.value,
  //           discountAmount: vendorDiscount,
  //           influencerId: coupon.influencerId,
  //           influencerCode: coupon.influencerId ? coupon.code : undefined,
  //           influencerCommissionRate,
  //           influencerCommissionAmount,
  //         };
  //       }

  //       // 5e. Persist VendorOrder (orderId omitted — back-filled in step 7)
  //       const estimatedDeliveryDate = new Date();
  //       estimatedDeliveryDate.setDate(
  //         estimatedDeliveryDate.getDate() + Math.floor(Math.random() * 7) + 1,
  //       );

  //       const [vendorOrder] = await this.vendorOrderModel.create(
  //         [
  //           {
  //             userId: new Types.ObjectId(userId),
  //             vendorId: (vendor as any)._id,
  //             orderNumber: `${orderNumber}-${vendorIdStr.slice(-4)}`,
  //             shippingAddress: {
  //               phone: address.phone1,
  //               line1: address.line1,
  //               line2: address.line2,
  //               city: address.city,
  //               state: address.state,
  //               pincode: address.pincode,
  //             },
  //             items: orderItems,
  //             subTotal,
  //             discount: vendorDiscount,
  //             shippingCharge,
  //             tax,
  //             grandTotal: vendorGrandTotal,
  //             commissionRate: platformCommissionRate,
  //             commissionAmount: platformCommissionAmount,
  //             payoutAmount: vendorPayoutAmount,
  //             orderStatus: OrderStatus.PENDING,
  //             paymentStatus:
  //               dto.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
  //                 ? PaymentStatus.PENDING
  //                 : PaymentStatus.PAID,
  //             estimatedDeliveryDate,
  //           },
  //         ],
  //         { session },
  //       );

  //       vendorOrderIds.push(vendorOrder._id);

  //       // 5f. Atomic stock decrement
  //       for (const { variant, quantity } of variantsToUpdate) {
  //         const updated = await this.variantModel.findOneAndUpdate(
  //           { _id: variant._id, stock: { $gte: quantity } },
  //           { $inc: { stock: -quantity } },
  //           { new: true, session },
  //         );
  //         if (!updated) {
  //           throw new BadRequestException(`${variant.sku} is out of stock`);
  //         }
  //       }

  //       // 5g. Vendor payout (orderId omitted — back-filled in step 7)
  //       // const [payout] = await this.vendorPayoutModel.create(
  //       //   [
  //       //     {
  //       //       vendorId: (vendor as any)._id,
  //       //       vendorOrderId:new Types.ObjectId(vendorOrder._id),
  //       //       vendorUserId: vendor.ownerId,
  //       //       orderAmount: subTotal,
  //       //       discountAmount: vendorDiscount,
  //       //       finalOrderAmount,
  //       //       platformCommissionRate,
  //       //       platformCommissionAmount,
  //       //       payoutAmount: vendorPayoutAmount,
  //       //       influencerCommissionAmount,
  //       //     },
  //       //   ],
  //       //   { session },
  //       // );

  //       // vendorPayoutIds.push(payout._id);   // ← capture ID

  //       orderSubTotal += subTotal;
  //       orderDiscount += vendorDiscount;
  //       orderGrandTotal += vendorGrandTotal;
  //     }

  //     // ── 6. Create parent Order ────────────────────────────────────────────
  //     const [order] = await this.orderModel.create(
  //       [
  //         {
  //           userId: new Types.ObjectId(userId),
  //           orderNumber,
  //           shippingAddress: {
  //             phone: address.phone1,
  //             line1: address.line1,
  //             line2: address.line2,
  //             city: address.city,
  //             state: address.state,
  //             pincode: address.pincode,
  //           },
  //           vendorOrders: vendorOrderIds,
  //           appliedCoupon: appliedCouponSnapshot,
  //           paymentMethod: dto.paymentMethod,
  //           paymentStatus:
  //             dto.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
  //               ? PaymentStatus.PENDING
  //               : PaymentStatus.PAID,
  //           orderStatus: OrderStatus.PENDING,
  //           subTotal: orderSubTotal,
  //           discount: orderDiscount,
  //           shippingCharge: shippingCharge * vendorBuckets.size,
  //           tax: tax * vendorBuckets.size,
  //           grandTotal: orderGrandTotal,
  //         },
  //       ],
  //       { session },
  //     );

  //     // ── 7. Back-fill orderId by ID (race-condition safe) ──────────────────
  //     await this.vendorOrderModel.updateMany(
  //       { _id: { $in: vendorOrderIds } },
  //       { $set: { orderId: order._id } },
  //       { session },
  //     );

  //     // await this.vendorPayoutModel.updateMany(
  //     //   { _id: { $in: vendorPayoutIds } },   // ← by ID, not null filter
  //     //   { $set: { orderId: order._id } },
  //     //   { session },
  //     // );

  //     // ── 8. Coupon usage + influencer commission ───────────────────────────
  //     if (coupon && appliedCouponSnapshot) {
  //       await this.couponUsageModel.create(
  //         [
  //           {
  //             couponId: coupon._id,
  //             userId: new Types.ObjectId(userId),
  //             orderId: order._id,
  //           },
  //         ],
  //         { session },
  //       );

  //       await this.couponModel.findByIdAndUpdate(
  //         coupon._id,
  //         { $inc: { totalUsed: 1 } },
  //         { session },
  //       );

  //       if (influencer && coupon.influencerId) {
  //         for (const [vendorIdStr, bucket] of vendorBuckets) {
  //           const vendorDiscount = bucket.orderItems.reduce(
  //             (s, oi) => s + (oi.discountAmount ?? 0),
  //             0,
  //           );
  //           if (vendorDiscount === 0) continue;

  //           // const influencerCommissionRate = influencer.commissionRate || 0;
  //           // const influencerCommissionAmount =
  //           //   (vendorDiscount * influencerCommissionRate) / 100;

  //           await this.influencerCommisionModel.create(
  //             [
  //               {
  //                 influencerId: coupon.influencerId,
  //                 influencerUserId: influencer.userId,
  //                 orderId: order._id,
  //                 couponId: coupon._id,
  //                 vendorId: new Types.ObjectId(vendorIdStr),
  //                 orderAmount: bucket.subTotal,
  //                 discountAmount: vendorDiscount,
  //                 finalOrderAmount: bucket.subTotal - vendorDiscount,
  //                 // commissionRate: influencerCommissionRate,
  //                 // commissionAmount: influencerCommissionAmount,
  //                 status: CommissionStatus.PENDING,
  //               },
  //             ],
  //             { session },
  //           );
  //         }
  //       }
  //     }

  //     await session.commitTransaction();
  //     return ApiResponse.success('Order Placed Successfully', order);
  //   } catch (error) {
  //     await session.abortTransaction();
  //     throw error;
  //   } finally {
  //     session.endSession();
  //   }
  // }

  async placeOrder(dto: CreateOrderDto, userId: string) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      // ─────────────────────────────────────────────────────────────
      // 1. Validate Address
      // ─────────────────────────────────────────────────────────────
      const address = await this.addressModel
        .findOne({
          _id: new Types.ObjectId(dto.addressId),
          user: new Types.ObjectId(userId),
        })
        .session(session);

      if (!address) {
        throw new NotFoundException('Address Not Found');
      }

      if (!dto.items?.length) {
        throw new BadRequestException('No Items Found');
      }

      // ─────────────────────────────────────────────────────────────
      // 2. Prevent duplicate variants
      // ─────────────────────────────────────────────────────────────
      const uniqueVariantIds = new Set<string>();

      for (const item of dto.items) {
        if (uniqueVariantIds.has(item.variantId)) {
          throw new BadRequestException('Duplicate variants are not allowed');
        }

        uniqueVariantIds.add(item.variantId);
      }

      // ─────────────────────────────────────────────────────────────
      // 3. Group items by vendor
      // ─────────────────────────────────────────────────────────────
      const vendorBuckets = new Map<
        string,
        {
          vendor: VendorDocument;

          orderItems: Partial<OrderItem>[];

          variantsToUpdate: {
            variant: any;
            quantity: number;
          }[];

          subTotal: number;

          totalWeight: number;
          declaredValue: number;

          length: number;
          width: number;
          height: number;
        }
      >();

      for (const item of dto.items) {
        const product = await this.productModel
          .findById(item.productId)
          .session(session);

        if (!product) {
          throw new NotFoundException('Product Not Found');
        }

        const variant = await this.variantModel
          .findById(item.variantId)
          .session(session);

        if (!variant) {
          throw new NotFoundException('Variant Not Found');
        }

        if (!product.vendorId) {
          throw new BadRequestException('Vendor Not Found');
        }

        const isVariantBelongsToProduct = product.variants.some(
          (id) => id.toString() === variant._id.toString(),
        );

        if (!isVariantBelongsToProduct) {
          throw new BadRequestException('Variant does not belong to product');
        }

        if (variant.stock < item.quantity) {
          throw new BadRequestException(`${product.name} is out of stock`);
        }

        const vendorIdStr = product.vendorId.toString();

        if (!vendorBuckets.has(vendorIdStr)) {
          const vendor = await this.vendorModel
            .findById(product.vendorId)
            .session(session);

          if (!vendor) {
            throw new NotFoundException('Vendor not found');
          }

          vendorBuckets.set(vendorIdStr, {
            vendor,
            orderItems: [],
            variantsToUpdate: [],
            subTotal: 0,

            totalWeight: 0,
            declaredValue: 0,

            length: 0,
            width: 0,
            height: 0,
          });
        }

        const bucket = vendorBuckets.get(vendorIdStr)!;

        const price =
          variant.offeredPrice || variant.salesPrice || variant.costPrice;

        const totalPrice = price * item.quantity;

        bucket.subTotal += totalPrice;

        // shipping calculations
        bucket.totalWeight += (variant.weight || 0.5) * item.quantity;

        bucket.declaredValue += totalPrice;

        bucket.length = Math.max(bucket.length, variant.length || 10);

        bucket.width = Math.max(bucket.width, variant.width || 10);

        bucket.height += (variant.height || 10) * item.quantity;

        // order item
        bucket.orderItems.push({
          productId: product._id,
          variantId: variant._id,
          vendorId: product.vendorId,

          productName: product.name,

          sku: variant.sku,

          attributes: variant.attributes || {},

          quantity: item.quantity,

          offeredPrice: variant.offeredPrice || 0,
          salesPrice: variant.salesPrice || 0,
          costPrice: variant.costPrice || 0,

          totalPrice,

          weight: variant.weight,
          length: variant.length,
          width: variant.width,
          height: variant.height,
        });

        bucket.variantsToUpdate.push({
          variant,
          quantity: item.quantity,
        });
      }

      // ─────────────────────────────────────────────────────────────
      // 4. Resolve Coupon
      // ─────────────────────────────────────────────────────────────
      let coupon: CouponDocument | null = null;

      let influencer: InfluencerDocument | null = null;

      if (dto.couponCode) {
        coupon = await this.couponModel.findOne({
          code: dto.couponCode.trim().toUpperCase(),
          isActive: true,
        });

        if (!coupon) {
          throw new BadRequestException('Invalid Coupon');
        }

        // vendor coupon validation
        if (coupon.scope === CouponScope.VENDOR && coupon.vendorId) {
          if (!vendorBuckets.has(coupon.vendorId.toString())) {
            throw new BadRequestException('Coupon not applicable for cart');
          }
        }

        const now = new Date();

        if (coupon.startsAt && now < coupon.startsAt) {
          throw new BadRequestException('Coupon not started yet');
        }

        if (coupon.expiresAt && now > coupon.expiresAt) {
          throw new BadRequestException('Coupon expired');
        }

        if (
          coupon.totalUsageLimit &&
          coupon.totalUsed >= coupon.totalUsageLimit
        ) {
          throw new BadRequestException('Coupon usage limit exceeded');
        }

        const userCouponUsage = await this.couponUsageModel.countDocuments({
          couponId: coupon._id,
          userId: new Types.ObjectId(userId),
        });

        if (
          coupon.usageLimitPerUser &&
          userCouponUsage >= coupon.usageLimitPerUser
        ) {
          throw new BadRequestException('Coupon limit reached for user');
        }

        if (coupon.influencerId) {
          influencer = await this.influencerModel.findById(coupon.influencerId);

          if (!influencer) {
            throw new NotFoundException('Influencer not found');
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 5. Create Vendor Orders
      // ─────────────────────────────────────────────────────────────
      const vendorOrderIds: Types.ObjectId[] = [];

      const orderNumber = `ORD-${Date.now()}`;

      let orderSubTotal = 0;
      let orderDiscount = 0;
      let orderShippingCharge = 0;
      let orderCodCharge = 0;
      let orderGrandTotal = 0;

      let appliedCouponSnapshot: any = null;
      const influencerCommissionPayloads: any[] = [];
      for (const [vendorIdStr, bucket] of vendorBuckets) {
        const { vendor, orderItems, variantsToUpdate, subTotal } = bucket;

        // ─────────────────────────────────────────
        // SHIPPING
        // ─────────────────────────────────────────
        let shippingCharge = 0;
        let codCharge = 0;

        let estimatedDays = 0;
        let estimatedDate: any = null;

        try {
          const shipping = await this.shiprocketService.getShippingOptions({
            pickupPincode: vendor.vendorPincode,
            deliveryPincode: address.pincode,

            weightKg: bucket.totalWeight,

            declaredValue: bucket.declaredValue,

            isCOD: dto.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 1 : 0,

            length: bucket.length,
            breadth: bucket.width,
            height: bucket.height,
          });

          shippingCharge = Number(shipping.shippingCharge) || 0;

          codCharge =
            dto.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
              ? Number(shipping.codCharge) || 0
              : 0;

          estimatedDays = Number(shipping.estimatedDays) || 0;

          estimatedDate = shipping.estimatedDate || null;
        } catch (error) {
          throw new BadRequestException(
            `Shipping unavailable for vendor ${vendor.businessName}`,
          );
        }

        // ─────────────────────────────────────────
        // COUPON DISCOUNT
        // ─────────────────────────────────────────
        let vendorDiscount = 0;

        if (coupon) {
          const isApplicable =
            coupon.scope !== CouponScope.VENDOR ||
            coupon.vendorId?.toString() === vendorIdStr;

          if (isApplicable) {
            if (
              !coupon.minimumOrderAmount ||
              subTotal >= coupon.minimumOrderAmount
            ) {
              if (coupon.type === CouponType.PERCENTAGE) {
                vendorDiscount = (subTotal * coupon.value) / 100;

                if (
                  coupon.maximumDiscount &&
                  vendorDiscount > coupon.maximumDiscount
                ) {
                  vendorDiscount = coupon.maximumDiscount;
                }
              } else {
                const totalSubTotal = [...vendorBuckets.values()].reduce(
                  (sum, b) => sum + b.subTotal,
                  0,
                );

                vendorDiscount = (subTotal / totalSubTotal) * coupon.value;
              }
            }
          }
        }

        // ─────────────────────────────────────────
        // ITEM DISCOUNT DISTRIBUTION
        // ─────────────────────────────────────────
        for (const oi of orderItems) {
          if (vendorDiscount > 0) {
            oi.discountAmount = parseFloat(
              ((oi.totalPrice! / subTotal) * vendorDiscount).toFixed(2),
            );
          } else {
            oi.discountAmount = 0;
          }

          oi.finalPrice = parseFloat(
            (oi.totalPrice! - oi.discountAmount!).toFixed(2),
          );
        }

        // ─────────────────────────────────────────
        // COMMISSION
        // ─────────────────────────────────────────
        const finalOrderAmount = subTotal - vendorDiscount;

        const platformCommissionRate = vendor.commissionRate || 0;

        const platformCommissionAmount =
          (finalOrderAmount * platformCommissionRate) / 100;

        const payoutAmount = finalOrderAmount - platformCommissionAmount;

        // ─────────────────────────────────────────
        // GRAND TOTAL
        // ─────────────────────────────────────────
        const tax = 0;

        const vendorGrandTotal =
          finalOrderAmount + shippingCharge + codCharge + tax;

        // ─────────────────────────────────────────
        // COUPON SNAPSHOT
        // ─────────────────────────────────────────
        if (coupon && vendorDiscount > 0) {
          appliedCouponSnapshot = {
            code: coupon.code,

            couponId: coupon._id,

            scope: coupon.scope,

            couponType: coupon.type,

            couponValue: (coupon.value || 0).toFixed(2),

            discountAmount: (vendorDiscount || 0).toFixed(2),

            influencerId: coupon.influencerId,

            influencerCode: coupon.influencerId ? coupon.code : undefined,
          };
        }

        const totalCostPrice = orderItems.reduce(
          (sum, item) => sum + (item.costPrice || 0) * (item.quantity || 0),
          0,
        );

        const totalSellingPrice = orderItems.reduce(
          (sum, item) => sum + (item.salesPrice || 0) * (item.quantity || 0),
          0,
        );

        const totalOfferedPrice = orderItems.reduce(
          (sum, item) => sum + (item.offeredPrice || 0) * (item.quantity || 0),
          0,
        );

        const grossProfit = finalOrderAmount - totalCostPrice;

        const netProfit =
          grossProfit - platformCommissionAmount - shippingCharge - codCharge;

        // ─────────────────────────────────────────
        // CREATE VENDOR ORDER
        // ─────────────────────────────────────────
        const [vendorOrder] = await this.vendorOrderModel.create(
          [
            {
              userId: new Types.ObjectId(userId),

              vendorId: (vendor as any)._id,

              orderNumber: `${orderNumber}-${vendorIdStr.slice(-4)}`,

              shippingAddress: {
                phone: address.phone1,
                line1: address.line1,
                line2: address.line2,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
              },

              items: orderItems,

              subTotal,

              discount: vendorDiscount,

              shippingCharge,

              codCharge,

              tax,

              grandTotal: vendorGrandTotal,

              commissionRate: platformCommissionRate,

              commissionAmount: platformCommissionAmount,
              platformCommissionRate,
              platformCommissionAmount,
              

              payoutAmount,

              estimatedDeliveryDate: estimatedDate,

              orderStatus: OrderStatus.PENDING,

              costPrice: totalCostPrice,
              sellingPrice: totalSellingPrice,
              offeredPrice: totalOfferedPrice,
              grossProfit,
              netProfit,

              paymentStatus:
                dto.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
                  ? PaymentStatus.PENDING
                  : PaymentStatus.PAID,
            },
          ],
          { session },
        );

        if (influencer && coupon?.influencerId && vendorDiscount > 0) {
          influencerCommissionPayloads.push({
            influencerId: coupon.influencerId,

            influencerUserId: influencer.userId,

            vendorOrderId: vendorOrder._id,

            vendorId: new Types.ObjectId(vendorIdStr),

            couponId: coupon._id,

            orderAmount: subTotal,

            discountAmount: vendorDiscount,

            finalOrderAmount,

            totalCostPrice,

            grossProfit,
            netProfit,

            shippingCost: shippingCharge,

            taxAmount: tax,

            platformCommissionAmount,

            commissionRate: 0,

            commissionAmount: 0,

            status: CommissionStatus.PENDING,

            commissionMonth: new Date().getMonth() + 1,

            commissionYear: new Date().getFullYear(),
          });
        }

        vendorOrderIds.push(vendorOrder._id);

        // ─────────────────────────────────────────
        // UPDATE STOCK
        // ─────────────────────────────────────────
        for (const { variant, quantity } of variantsToUpdate) {
          const updated = await this.variantModel.findOneAndUpdate(
            {
              _id: variant._id,
              stock: { $gte: quantity },
            },
            {
              $inc: {
                stock: -quantity,
              },
            },
            {
              new: true,
              session,
            },
          );

          if (!updated) {
            throw new BadRequestException(`${variant.sku} is out of stock`);
          }
        }

      
        orderSubTotal += subTotal;

        orderDiscount += vendorDiscount;

        orderShippingCharge += shippingCharge;

        orderCodCharge += codCharge;

        orderGrandTotal += vendorGrandTotal;
      }

      // ─────────────────────────────────────────────────────────────
      // 6. CREATE MAIN ORDER
      // ─────────────────────────────────────────────────────────────
      const [order] = await this.orderModel.create(
        [
          {
            userId: new Types.ObjectId(userId),

            orderNumber,

            shippingAddress: {
              phone: address.phone1,
              line1: address.line1,
              line2: address.line2,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
            },

            vendorOrders: vendorOrderIds,

            appliedCoupon: appliedCouponSnapshot,

            paymentMethod: dto.paymentMethod,

            paymentStatus:
              dto.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
                ? PaymentStatus.PENDING
                : PaymentStatus.PAID,

            orderStatus: OrderStatus.PENDING,

            subTotal: orderSubTotal,

            discount: orderDiscount,

            shippingCharge: orderShippingCharge,

            codCharge: orderCodCharge,

            tax: 0,

            grandTotal: orderGrandTotal,
          },
        ],
        { session },
      );


      await this.vendorOrderModel.updateMany(
        {
          _id: {
            $in: vendorOrderIds.map((id) => new Types.ObjectId(id)),
          },
        },
        {
          $set: {
            orderId: order._id,
          },
        },
        { session },
      );

      if (influencerCommissionPayloads.length) {
        const payloads = influencerCommissionPayloads.map((item) => ({
          ...item,
          orderId: order._id,
          

        }));

        await this.influencerCommisionModel.create(payloads, { session });
      }

      // ─────────────────────────────────────────────────────────────
      // 8. COUPON USAGE
      // ─────────────────────────────────────────────────────────────
      if (coupon) {
        await this.couponUsageModel.create(
          [
            {
              couponId: coupon._id,

              userId: new Types.ObjectId(userId),

              orderId: order._id,
            },
          ],
          { session },
        );

        await this.couponModel.findByIdAndUpdate(
          coupon._id,
          {
            $inc: {
              totalUsed: 1,
            },
          },
          { session },
        );
      }

      await session.commitTransaction();

      return ApiResponse.success('Order placed successfully', order);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  

  async userOrders(userId: string) {
    const orders = await this.orderModel
      .find({
        userId: new Types.ObjectId(userId),
      })
      .populate({
        path: 'vendorOrders',
        populate: [
          {
            path: 'items.productId',
            select: 'name web_image app_image',
          },
          {
            path: 'items.variantId',
          },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success('Orders fetched successfully', orders);
  }

  async userOrderDetails(userId: string, orderId: string) {
    const order = await this.orderModel
      .findOne({
        _id: new Types.ObjectId(orderId),
        userId: new Types.ObjectId(userId),
      })
     .populate({
        path: 'vendorOrders',
        populate: [
          {
            path: 'items.productId',
            select: 'name web_image app_image',
          },
          {
            path: 'items.variantId',
          },
        ],
      })
      .lean();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return ApiResponse.success('Order details fetched successfully', order);
  }

  // async returnOrCancelOrder(
  //   userId: string,
  //   orderId: string,
  //   dto: UpdateUserOrderDTO,
  // ) {
  //   const order = await this.orderModel.findOne({
  //     _id: new Types.ObjectId(orderId),
  //     userId: new Types.ObjectId(userId),
  //   });

  //   if (!order) {
  //     throw new NotFoundException('Order Not Found');
  //   }

  //   // =========================
  //   // RETURN ORDER
  //   // =========================
  //   if (dto.orderStatus === OrderStatus.RETURNED) {
  //     // already returned
  //     if (order.orderStatus === OrderStatus.RETURNED) {
  //       throw new ConflictException('Order already returned');
  //     }

  //     // only delivered orders can be returned
  //     if (order.orderStatus !== OrderStatus.DELIVERED) {
  //       throw new ConflictException('Only delivered orders can be returned');
  //     }

  //     if (!dto.returnReason) {
  //       throw new ConflictException(
  //         'Return reason should be provided for return',
  //       );
  //     }

  //     if (!order.deliveredAt) {
  //       throw new ConflictException('Delivered date not found');
  //     }

  //     const deliveredDate = new Date(order.deliveredAt);

  //     const currentDate = new Date();

  //     const diffInMs = currentDate.getTime() - deliveredDate.getTime();

  //     const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  //     if (diffInDays > 7) {
  //       throw new ConflictException(
  //         'Return window expired. Product can only be returned within 7 days of delivery',
  //       );
  //     }

  //     order.orderStatus = OrderStatus.RETURNED;

  //     order.returnReason = dto.returnReason;

  //     order.returnedAt = new Date();
  //   }

  //   // =========================
  //   // CANCEL ORDER
  //   // =========================
  //   if (dto.orderStatus === OrderStatus.CANCELLED) {
  //     // already cancelled
  //     if (order.orderStatus === OrderStatus.CANCELLED) {
  //       throw new ConflictException('Order already cancelled');
  //     }

  //     // delivered orders cannot be cancelled
  //     if (order.orderStatus === OrderStatus.DELIVERED) {
  //       throw new ConflictException('Delivered orders cannot be cancelled');
  //     }

  //     // returned orders cannot be cancelled
  //     if (order.orderStatus === OrderStatus.RETURNED) {
  //       throw new ConflictException('Returned orders cannot be cancelled');
  //     }

  //     if (!dto.cancellationReason) {
  //       throw new ConflictException('Cancellation reason should be provided');
  //     }

  //     order.orderStatus = OrderStatus.CANCELLED;

  //     order.cancellationReason = dto.cancellationReason;

  //     order.cancelledAt = new Date();

  //     order.cancelledBy = new Types.ObjectId(userId);
  //   }

  //   await order.save();

  //   return ApiResponse.success(
  //     `Order request raised for ${dto.orderStatus} successfully!`,
  //     order,
  //   );
  // }
}
