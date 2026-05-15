import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import {
  Order,
  OrderDocument,
  OrderItem,
  OrderStatus,
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
  CouponType,
} from '../coupon/schema/coupon.schema';

import { ApiResponse } from 'src/common/responses/api-response';

import { CreateOrderDto } from './dto/order.dto';
import {
  Influencer,
  InfluencerDocument,
} from 'src/influencer/schema/influencer.schema';

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
  ) {}

  async placeOrder(dto: CreateOrderDto, userId: string) {
    // const session = await this.orderModel.db.startSession();
    // session.startTransaction()
    try {
      const address = await this.addressModel.findOne({
        _id: new Types.ObjectId(dto.addressId),
        user: new Types.ObjectId(userId),
      });

      if (!address) {
        throw new NotFoundException('Address Not Found');
      }

      if (!dto.items.length) {
        throw new BadRequestException('No Items Found');
      }

      const uniqueVariantIds = new Set<string>();

      for (const item of dto.items) {
        if (uniqueVariantIds.has(item.variantId)) {
          throw new BadRequestException('Duplicate variants are not allowed');
        }

        uniqueVariantIds.add(item.variantId);
      }

      const orderItems: Partial<OrderItem>[] = [];

      let vendorId: string | undefined;

      let subTotal = 0;

      for (const item of dto.items) {
        const product = await this.productModel.findById(item.productId);

        if (!product) {
          throw new NotFoundException('Product Not Found');
        }

        const variant = await this.variantModel.findById(item.variantId);

        if (!variant) {
          throw new NotFoundException('Variant Not Found');
        }

        if (!product.vendorId) {
          throw new BadRequestException('Vendor Not Found');
        }

        if (
          !product.variants.some(
            (id) => id.toString() === variant._id.toString(),
          )
        ) {
          throw new BadRequestException('Variant does not belong to product');
        }

        const currentVendorId = product.vendorId.toString();

        if (!vendorId) {
          vendorId = currentVendorId;
        }

        if (vendorId !== currentVendorId) {
          throw new BadRequestException(
            'All products must belong to same vendor',
          );
        }

        if (variant.stock < item.quantity) {
          throw new BadRequestException(`${product.name} is out of stock`);
        }

        const sellingPrice = variant.salesPrice || variant.price;

        const totalPrice = sellingPrice * item.quantity;

        subTotal += totalPrice;

        orderItems.push({
          productId: product._id,
          variantId: variant._id,
          productName: product.name,
          sku: variant.sku,
          attributes: variant.attributes || {},
          quantity: item.quantity,
          price: variant.price,
          salesPrice: variant.salesPrice || 0,
          totalPrice,
        });
        variant.stock -= item.quantity;
        await variant.save();
      }

      // ==============================
      // APPLY COUPON
      // ==============================

      let discount = 0;

      let appliedCoupon: any = null;

      if (dto.couponCode) {
        const coupon = await this.couponModel.findOne({
          code: dto.couponCode.trim().toUpperCase(),
          isActive: true,
        });

        if (!coupon) {
          throw new BadRequestException('Invalid Coupon');
        }

        const now = new Date();

        // coupon start validation
        if (coupon.startsAt && now < coupon.startsAt) {
          throw new BadRequestException('Coupon not started yet');
        }

        // coupon expiry validation
        if (coupon.expiresAt && now > coupon.expiresAt) {
          throw new BadRequestException('Coupon expired');
        }

        if (
          coupon.totalUsageLimit &&
          coupon.totalUsed >= coupon.totalUsageLimit
        ) {
          throw new BadRequestException('Coupon Usage Limit Exceeded');
        }

        const userCouponUsage = await this.orderModel.countDocuments({
          userId: new Types.ObjectId(userId),
          'appliedCoupon.couponId': coupon._id,
        });
        if (
          coupon.usageLimitPerUser &&
          userCouponUsage >= coupon.usageLimitPerUser
        ) {
          throw new BadRequestException('Coupon limit reached for this user');
        }

        // minimum amount validation
        if (coupon.minimumOrderAmount && subTotal < coupon.minimumOrderAmount) {
          throw new BadRequestException(
            `Minimum order amount should be ${coupon.minimumOrderAmount}`,
          );
        }

        // percentage coupon
        if (coupon.type === CouponType.PERCENTAGE) {
          discount = (subTotal * coupon.value) / 100;

          // max discount validation
          if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
            discount = coupon.maximumDiscount;
          }
        }

        // fixed coupon
        else {
          discount = coupon.value;
        }

        let influencer: any = null;
        if (coupon.influencerId) {
          influencer = await this.influencerModel.findById(
            new Types.ObjectId(coupon.influencerId),
          );
          if (!influencer) {
            throw new NotFoundException('Influencer Not found');
          }
        }

        appliedCoupon = {
          code: coupon.code,
          couponId: coupon._id,
          influencerId: coupon.influencerId,
          influencerName: coupon.influencerId ? influencer.name : '',
          influencerCode: coupon.influencerId ? influencer.referralCode : '',
          couponType: coupon.type,
          couponValue: coupon.value,
          discountAmount: discount,
        };

        // increase coupon usage
        coupon.totalUsed += 1;

        await coupon.save();
      }

      // ==============================
      // SHIPPING + TAX
      // ==============================

      const shippingCharge = 100;

      const tax = 100;

      const grandTotal = subTotal - discount + shippingCharge + tax;

      const randomDays = Math.floor(Math.random() * 7) + 1;

      const estimatedDeliveryDate = new Date();

      estimatedDeliveryDate.setDate(
        estimatedDeliveryDate.getDate() + randomDays,
      );

      // ==============================
      // ORDER CREATION
      // ==============================

      const orderNumber = `ORD-${Date.now()}`;

      const order = await this.orderModel.create({
        userId: new Types.ObjectId(userId),
        vendorId: new Types.ObjectId(vendorId),
        estimatedDeliveryDate,
        addressId: address._id,
        shippingAddress: {
          phone: address.phone1,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        orderNumber,
        items: orderItems,
        appliedCoupon,
        paymentMethod: dto.paymentMethod,
        paymentStatus:
          dto.paymentMethod === 'CashOnDelivery'
            ? PaymentStatus.PENDING
            : PaymentStatus.PAID,
        orderStatus: OrderStatus.PENDING,
        subTotal,
        discount,
        shippingCharge,
        tax,
        grandTotal,
        notes: dto.notes,
      });

      return ApiResponse.success('Order Placed Successfully', order);
    } catch (error) {
      throw error;
    }
  }

  async userOrders(userId: string) {
    const orders = await this.orderModel
      .find({
        userId: new Types.ObjectId(userId),
      })
      .populate('userId')
      .populate('vendorId')
      .populate('addressId')
      .populate('items.productId')
      .populate('items.variantId')
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
      .populate('userId')
      .populate('vendorId')
      .populate('addressId')
      .populate('items.productId')
      .populate('items.variantId')
      .lean();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return ApiResponse.success('Order details fetched successfully', order);
  }

  async returnOrCancelOrder(userId:string,orderId:string,status:string){
    const order = await this.orderModel.findOne({_id:new Types.ObjectId(orderId),userId:new Types.ObjectId(userId)})
    if(!order){
      throw new NotFoundException("Order Not Found")
    }
    
  }
 
}
