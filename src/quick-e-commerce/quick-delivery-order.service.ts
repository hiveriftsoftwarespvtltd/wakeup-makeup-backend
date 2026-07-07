import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectModel, InjectConnection } from "@nestjs/mongoose";
import { Model, Types, Connection } from "mongoose";
import { QuickOrder, QuickOrderDocument, QuickOrderStatus, PaymentStatus, OrderItemStatus, PaymentMethod } from "./schema/quick-order.schema";
import { VendorQuickOrder, VendorOrderDocument, VendorOrderStatus } from "./schema/quick-vendor-order.schema";
import { QuickDeliveryCart, QuickDeliveryCartDocument } from "./schema/quick-delivery-cart";
import { Address, AddressDocument } from "src/address/schema/address.schema";
import { ProductVariant, ProductVariantDocument } from "src/product/schema/product-variant.schema";
import { Coupon, CouponDocument } from "src/coupon/schema/coupon.schema";
import { UserWallet, UserWalletDocument } from "src/wallet/schema/user/user.wallet.schema";
import { WalletTransaction, WalletTransactionDocument, WalletTransactionType, WalletTransactionReason } from "src/wallet/schema/user/user.wallet.transactions";
import { QuickDeliveryCheckoutService } from "./quick-delivery-checkout.service";
import { PlaceQuickOrderDto } from "./dto/quick-order.dto";
import { Vendor, VendorDocument } from "src/vendor/schema/vendor.schema";
import { DeliveryPerson, DeliveryPersonDocument } from "./schema/delivery-person.schema";
import { CommissionRate, CommissionRateDocument, CommissionEntityType } from "src/admin/schema/commission-rate.schema";
import { Notification, NotificationDocument, NotificationModuleType, NotificationType, NotificationPriority } from "src/notification/schema/notification.schema";
import { NotificationService } from "src/notification/notification.service";
import { DocumentService } from "src/document/document.service";

@Injectable()
export class QuickOrderService {
    constructor(
        @InjectModel(QuickOrder.name) private quickOrderModel: Model<QuickOrderDocument>,
        @InjectModel(VendorQuickOrder.name) private vendorOrderModel: Model<VendorOrderDocument>,
        @InjectModel(QuickDeliveryCart.name) private cartModel: Model<QuickDeliveryCartDocument>,
        @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
        @InjectModel(ProductVariant.name) private variantModel: Model<ProductVariantDocument>,
        @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
        @InjectModel(UserWallet.name) private walletModel: Model<UserWalletDocument>,
        @InjectModel(WalletTransaction.name) private walletTxModel: Model<WalletTransactionDocument>,
        @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
        @InjectModel(DeliveryPerson.name) private deliveryPersonModel: Model<DeliveryPersonDocument>,
        @InjectModel(CommissionRate.name) private commissionRateModel: Model<CommissionRateDocument>,
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
        @InjectConnection() private connection: Connection,
        private checkoutService: QuickDeliveryCheckoutService,
        private notificationService: NotificationService,
        private documentService: DocumentService
    ) { }

    async placeOrder(userId: string, dto: PlaceQuickOrderDto) {
        // 1. Get checkout details to reuse calculation logic
        const checkoutRes = await this.checkoutService.getCheckoutDetails(userId, dto.couponCode);
        const checkoutDetails = checkoutRes.data;

        if (!checkoutDetails.groupedItems || checkoutDetails.groupedItems.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        // 2. Fetch User Address
        const address = await this.addressModel.findOne({
            _id: new Types.ObjectId(dto.addressId),
            user: new Types.ObjectId(userId),
            isActive: true,
            isDeleted: false
        });

        if (!address) {
            throw new NotFoundException('Delivery address not found or is invalid');
        }

        if (address.location && address.location.coordinates[0] === 0 && address.location.coordinates[1] === 0) {
            throw new BadRequestException('Address coordinates are invalid');
        }

        // 3. Pincode matching using full Vendor fetch
        // We will store the fetched vendors to avoid refetching them later
        const fullVendorsMap = new Map();
        for (const group of checkoutDetails.groupedItems) {
            const vendor = group.vendor;
            if (vendor) {
                const fullVendor = await this.vendorModel.findById(vendor._id);
                if (!fullVendor) {
                    throw new BadRequestException(`Vendor ${vendor.businessName} not found`);
                }
                if (fullVendor.vendorPincode !== address.pincode) {
                    throw new BadRequestException(`Delivery not available for vendor ${vendor.businessName} at your pincode (${address.pincode})`);
                }
                fullVendorsMap.set(vendor._id.toString(), fullVendor);
            }
        }

        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            // 4. Stock Check & Deduction
            const cartItems = checkoutDetails.items || [];
            const fullVariantsMap = new Map();
            for (const item of cartItems) {
                const variantId = item.variant?._id;
                if (!variantId) continue;

                const variant = await this.variantModel.findById(variantId).session(session);
                if (!variant || variant.stock < item.quantity) {
                    throw new BadRequestException(`Insufficient stock for product ${item.product?.name}`);
                }
                // Deduct stock
                variant.stock -= item.quantity;
                await variant.save({ session });

                fullVariantsMap.set(variantId.toString(), variant);
            }

            // 5. Update Coupon Usage if applied
            if (checkoutDetails.appliedCoupon) {
                const couponId = checkoutDetails.appliedCoupon._id;
                await this.couponModel.findByIdAndUpdate(couponId, { $inc: { totalUsed: 1 } }, { session });
            }

            // Wallet Check
            let paymentStatus = PaymentStatus.PENDING;
            if (dto.paymentMethod === PaymentMethod.WALLET) {
                const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) }).session(session);
                if (!wallet || wallet.balance < checkoutDetails.finalAmount) {
                    throw new BadRequestException('Insufficient wallet balance');
                }

                wallet.balance -= checkoutDetails.finalAmount;
                wallet.totalDebits += checkoutDetails.finalAmount;
                await wallet.save({ session });

                paymentStatus = PaymentStatus.PAID;
            }

            // 6. Create main QuickOrder
            const newOrder = new this.quickOrderModel({
                customerId: new Types.ObjectId(userId),
                addressId: new Types.ObjectId(dto.addressId),
                shippingAddress: {
                    fullName: 'User', // Would normally come from user profile, setting a default
                    phone: address.phone1,
                    line1: address.line1,
                    line2: address.line2,
                    city: address.city,
                    state: address.state,
                    pincode: address.pincode,
                    country: 'India'
                },
                location: address.location,
                paymentMethod: dto.paymentMethod,
                paymentStatus: paymentStatus,
                vendorOrders: [],
                subtotal: checkoutDetails.subtotal,
                deliveryCharge: checkoutDetails.deliveryCharge,
                tax: 0,
                discount: checkoutDetails.couponDiscount,
                grandTotal: checkoutDetails.finalAmount,
                status: QuickOrderStatus.PROCESSING,
                items: []
            });

            const createdOrder = await newOrder.save({ session });

            if (dto.paymentMethod === PaymentMethod.WALLET) {
                const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) }).session(session);
                if (wallet) {
                    const walletTx = new this.walletTxModel({
                        walletId: wallet._id,
                        userId: new Types.ObjectId(userId),
                        amount: checkoutDetails.finalAmount,
                        type: WalletTransactionType.DEBIT,
                        reason: WalletTransactionReason.ORDER_PAYMENT,
                        orderId: createdOrder._id,
                        description: `Payment for Quick Order ${createdOrder._id}`,
                        balanceAfterTransaction: wallet.balance
                    });
                    await walletTx.save({ session });
                }
            }

            // Fetch commission rate
            const commissionDoc = await this.commissionRateModel.findOne().session(session);
            const quickDeliverySlab = commissionDoc?.commissions?.find(s => s.entityType === CommissionEntityType.QUICK_DELIVERY);
            const vendorSlab = commissionDoc?.commissions?.find(s => s.entityType === CommissionEntityType.VENDOR);
            // Default to QUICK_DELIVERY slab, otherwise VENDOR slab, otherwise 25%
            const platformCommissionRate = quickDeliverySlab?.commissionPercentage ?? vendorSlab?.commissionPercentage ?? 25;

            // 7. Create VendorQuickOrders and map OrderItems
            const orderItemsList: any[] = [];
            const vendorOrderIds: Types.ObjectId[] = [];
            const vendorOwnerIds: Set<string> = new Set();

            for (const group of checkoutDetails.groupedItems) {
                const vendor = group.vendor;
                const fullVendor = fullVendorsMap.get(vendor._id.toString());
                const groupItems = group.items;

                if (fullVendor && fullVendor.ownerId) {
                    vendorOwnerIds.add(fullVendor.ownerId.toString());
                }

                let vendorSubtotal = 0;
                const vendorOrderItems: any[] = [];

                for (const item of groupItems) {
                    const variant = item.variant;
                    const product = item.product;
                    const fullVariant = fullVariantsMap.get(variant?._id?.toString());

                    const salesPrice = variant.salesPrice || 0;
                    const offeredPrice = variant.offeredPrice || 0;
                    const finalPrice = offeredPrice > 0 && salesPrice > offeredPrice ? offeredPrice : salesPrice;

                    vendorSubtotal += (finalPrice * item.quantity);

                    const itemTotalPrice = finalPrice * item.quantity;
                    let itemCouponDiscount = 0;
                    if (checkoutDetails.appliedCoupon && checkoutDetails.couponDiscount > 0 && checkoutDetails.subtotal > 0) {
                        itemCouponDiscount = (itemTotalPrice / checkoutDetails.subtotal) * checkoutDetails.couponDiscount;
                    }

                    const orderItem: any = {
                        productId: new Types.ObjectId(product._id),
                        variantId: new Types.ObjectId(variant._id),
                        vendorId: new Types.ObjectId(vendor._id),
                        productName: product.name,
                        sku: fullVariant?.sku || 'N/A',
                        attributes: variant.attributes || {},
                        quantity: item.quantity,
                        costPrice: fullVariant?.costPrice || 0,
                        salesPrice: salesPrice,
                        offeredPrice: offeredPrice,
                        totalPrice: salesPrice * item.quantity,
                        discountAmount: (salesPrice > offeredPrice && offeredPrice > 0) ? (salesPrice - offeredPrice) * item.quantity : 0,
                        finalPrice: itemTotalPrice,
                        status: OrderItemStatus.PENDING,
                        couponId: checkoutDetails.appliedCoupon ? new Types.ObjectId(checkoutDetails.appliedCoupon._id) : undefined,
                        couponCode: checkoutDetails.appliedCoupon?.code,
                        appliedCouponDiscountAmount: itemCouponDiscount
                    };

                    vendorOrderItems.push(orderItem);
                    orderItemsList.push(orderItem);
                }

                // Calculate proportional vendor discount if global coupon applied
                let vendorDiscountAmount = 0;
                if (checkoutDetails.couponDiscount > 0 && checkoutDetails.subtotal > 0) {
                    vendorDiscountAmount = (vendorSubtotal / checkoutDetails.subtotal) * checkoutDetails.couponDiscount;
                }

                const vendorTotal = vendorSubtotal - vendorDiscountAmount;
                const vendorCommissionAmount = (vendorTotal * platformCommissionRate) / 100;

                const vendorOrder = new this.vendorOrderModel({
                    quickOrderId: createdOrder._id,
                    vendorId: new Types.ObjectId(vendor._id),
                    items: vendorOrderItems,
                    subtotal: vendorSubtotal,
                    packingCharge: 0,
                    deliveryCharge: checkoutDetails.groupedItems.length === 1 ? checkoutDetails.deliveryCharge : 0,
                    tax: 0,
                    total: vendorTotal,
                    discountAmount: vendorDiscountAmount,
                    couponId: checkoutDetails.appliedCoupon ? new Types.ObjectId(checkoutDetails.appliedCoupon._id) : undefined,
                    couponCode: checkoutDetails.appliedCoupon?.code,
                    appliedCouponDiscountAmount: vendorDiscountAmount,
                    commissionAmount: vendorCommissionAmount,
                    commissionRate: platformCommissionRate,
                    estimatedPreparationMinutes: fullVendor?.quickCommerce?.defaultPreparationTime || 10,
                    location: address.location,
                    status: VendorOrderStatus.PREPARING,
                    acceptedAt: new Date()
                });

                const savedVendorOrder = await vendorOrder.save({ session });
                vendorOrderIds.push(savedVendorOrder._id as Types.ObjectId);
            }

            // Update QuickOrder with items and vendorOrders
            createdOrder.items = orderItemsList;
            createdOrder.vendorOrders = vendorOrderIds;
            await createdOrder.save({ session });

            // 8. Clear Cart
            await this.cartModel.updateOne(
                { user: new Types.ObjectId(userId) },
                { $set: { items: [], appliedCoupon: null } },
                { session }
            );

            // 9. Send Notifications
            // To User
            await new this.notificationModel({
                receiverId: new Types.ObjectId(userId),
                type: NotificationType.TRANSACTIONAL,
                priority: NotificationPriority.HIGH,
                title: 'Order Placed Successfully',
                body: `Your quick delivery order #${createdOrder._id.toString().substring(0, 8)} has been placed successfully.`,
                moduleType: NotificationModuleType.ORDER
            }).save({ session });

            // To Vendors
            for (const ownerId of vendorOwnerIds) {
                await new this.notificationModel({
                    receiverId: new Types.ObjectId(ownerId),
                    type: NotificationType.TRANSACTIONAL,
                    priority: NotificationPriority.HIGH,
                    title: 'New Quick Order Received',
                    body: `You have received a new quick delivery order. Please prepare the items.`,
                    moduleType: NotificationModuleType.ORDER
                }).save({ session });

                await this.notificationService.sendNotification({
                    receiverId: ownerId,
                    type: NotificationType.TRANSACTIONAL,
                    priority: NotificationPriority.HIGH,
                    title: 'New Quick Order Received',
                    body: `You have received a new quick delivery order. Please prepare the items.`,
                    moduleType: NotificationModuleType.ORDER
                });
            }

            await this.notificationService.sendNotification({
                receiverId: userId,
                type: NotificationType.TRANSACTIONAL,
                priority: NotificationPriority.HIGH,
                title: 'Order Placed Successfully',
                body: `Your quick delivery order #${createdOrder._id.toString().substring(0, 8)} has been placed successfully.`,
                moduleType: NotificationModuleType.ORDER
            });

            await session.commitTransaction();
            session.endSession();

            return {
                message: 'Order placed successfully',
                orderId: createdOrder._id,
                status: createdOrder.status,
                grandTotal: createdOrder.grandTotal
            };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    // User Methods
    async getUserOrders(userId: string, page: number, limit: number, status?: QuickOrderStatus) {
        const skip = (page - 1) * limit;
        const query: any = { customerId: new Types.ObjectId(userId) };

        if (status) {
            query.status = status;
        }

        const [orders, total] = await Promise.all([
            this.quickOrderModel.find(query)
                .populate('vendorOrders')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.quickOrderModel.countDocuments(query)
        ]);

        return {
            orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async cancelOrder(userId: string, orderId: string, reason?: string) {
        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            const mainOrder = await this.quickOrderModel.findOne({ _id: new Types.ObjectId(orderId), customerId: new Types.ObjectId(userId) }).session(session);
            if (!mainOrder) throw new NotFoundException('Order not found');

            if (mainOrder.status === QuickOrderStatus.DELIVERED) {
                throw new BadRequestException('Cannot cancel a delivered order');
            }
            if (mainOrder.status === QuickOrderStatus.CANCELLED) {
                throw new BadRequestException('Order is already cancelled');
            }

            mainOrder.status = QuickOrderStatus.CANCELLED;
            mainOrder.items.forEach(item => {
                if (item.status !== OrderItemStatus.DELIVERED && item.status !== OrderItemStatus.RETURNED) {
                    item.status = OrderItemStatus.CANCELLED;
                    item.cancelledAt = new Date();
                    item.cancellationReason = reason || 'Cancelled by User';
                }
            });
            mainOrder.markModified('items');
            await mainOrder.save({ session });

            // Cancel all vendor orders that are not delivered
            const vendorOrdersToCancel = await this.vendorOrderModel.find({ _id: { $in: mainOrder.vendorOrders }, status: { $ne: VendorOrderStatus.DELIVERED } }).session(session);
            for (const vo of vendorOrdersToCancel) {
                vo.status = VendorOrderStatus.CANCELLED;
                vo.cancelledAt = new Date();
                vo.cancelledReason = reason || 'Cancelled by User';
                vo.items.forEach(item => {
                    if (item.status !== OrderItemStatus.DELIVERED && item.status !== OrderItemStatus.RETURNED) {
                        item.status = OrderItemStatus.CANCELLED;
                        item.cancelledAt = new Date();
                        item.cancellationReason = reason || 'Cancelled by User';
                    }
                });
                vo.markModified('items');
                await vo.save({ session });
            }

            // Refund if WALLET
            if (mainOrder.paymentMethod === PaymentMethod.WALLET) {
                const refundAmount = mainOrder.grandTotal;
                const wallet = await this.walletModel.findOne({ userId: mainOrder.customerId }).session(session);
                if (wallet) {
                    wallet.balance += refundAmount;
                    wallet.totalCredits += refundAmount;
                    await wallet.save({ session });

                    const walletTx = new this.walletTxModel({
                        walletId: wallet._id,
                        userId: mainOrder.customerId,
                        amount: refundAmount,
                        type: WalletTransactionType.CREDIT,
                        reason: WalletTransactionReason.REFUND,
                        orderId: mainOrder._id,
                        description: `Refund for Cancelled Order ${mainOrder._id} by User`,
                        balanceAfterTransaction: wallet.balance
                    });
                    await walletTx.save({ session });
                }
            }

            await session.commitTransaction();
            session.endSession();
            return { message: 'Order cancelled successfully', refundAmount: mainOrder.grandTotal };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    // Vendor Methods
    async getVendorOrders(vendorId: string, page: number, limit: number, status?: VendorOrderStatus, deliveryPersonId?: string) {
        const skip = (page - 1) * limit;
        const query: any = { vendorId: new Types.ObjectId(vendorId) };
        if (status) query.status = status;
        if (deliveryPersonId) query.deliveryPersonId = new Types.ObjectId(deliveryPersonId);

        const [orders, total] = await Promise.all([
            this.vendorOrderModel.find(query)
                .populate('deliveryPersonId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.vendorOrderModel.countDocuments(query)
        ]);

        return {
            orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async assignDeliveryPerson(vendorId: string, orderId: string, deliveryPersonId: string) {
        const vendorOrder = await this.vendorOrderModel.findOne({ _id: new Types.ObjectId(orderId), vendorId: new Types.ObjectId(vendorId) });
        if (!vendorOrder) throw new NotFoundException('Vendor order not found');

        const deliveryPerson = await this.deliveryPersonModel.findOne({ _id: new Types.ObjectId(deliveryPersonId), assignedVendorIds: new Types.ObjectId(vendorId), isDeleted: false, isActive: true });
        if (!deliveryPerson) throw new BadRequestException('Delivery person not found or not assigned to this vendor');

        vendorOrder.deliveryPersonId = new Types.ObjectId(deliveryPersonId);
        vendorOrder.readyAt = new Date();
        vendorOrder.status = VendorOrderStatus.OUT_FOR_DELIVERY;
        await vendorOrder.save();

        if (deliveryPerson.userId) {
            await this.notificationService.sendNotification({
                receiverId: deliveryPerson.userId.toString(),
                type: NotificationType.TRANSACTIONAL,
                priority: NotificationPriority.HIGH,
                title: 'New Order Assigned',
                body: `You have been assigned a new delivery for order #${vendorOrder._id.toString().substring(0, 8)}.`,
                moduleType: NotificationModuleType.ORDER
            });
            await new this.notificationModel({
                receiverId: deliveryPerson.userId,
                type: NotificationType.TRANSACTIONAL,
                priority: NotificationPriority.HIGH,
                title: 'New Order Assigned',
                body: `You have been assigned a new delivery for order #${vendorOrder._id.toString().substring(0, 8)}.`,
                moduleType: NotificationModuleType.ORDER
            }).save();
        }

        return { message: 'Delivery person assigned successfully', order: vendorOrder };
    }

    async updateVendorOrder(vendorId: string, orderId: string, status?: VendorOrderStatus, estimatedDeliveryMinutes?: number, estimatedPreparationMinutes?: number) {
        const vendorOrder = await this.vendorOrderModel.findOne({ _id: new Types.ObjectId(orderId), vendorId: new Types.ObjectId(vendorId) });
        if (!vendorOrder) throw new NotFoundException('Vendor order not found');

        if (status) vendorOrder.status = status;
        if (estimatedDeliveryMinutes !== undefined) vendorOrder.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
        if (estimatedPreparationMinutes !== undefined) vendorOrder.estimatedPreparationMinutes = estimatedPreparationMinutes;

        await vendorOrder.save();
        return vendorOrder;
    }

    async markVendorOrderAsDelivered(vendorOrderId: string, files: Express.Multer.File[], userId: string, role: 'VENDOR' | 'DELIVERY_PERSON') {
        let uploadedProofIds: string[] = [];
        if (files && files.length > 0) {
            const uploadRes: any = await this.documentService.uploadMultiplFiles(files, 'delivery-proofs', userId);
            uploadedProofIds = uploadRes.data.map((m: any) => m._id.toString());
        }

        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const vendorOrder = await this.vendorOrderModel.findById(vendorOrderId).session(session);
            if (!vendorOrder) throw new NotFoundException('Vendor order not found');

            if (role === 'VENDOR' && vendorOrder.vendorId.toString() !== userId) {
                throw new BadRequestException('You do not own this order');
            }

            if (role === 'DELIVERY_PERSON') {
                const deliveryPerson = await this.deliveryPersonModel.findOne({ userId: new Types.ObjectId(userId) });
                if (!deliveryPerson || vendorOrder.deliveryPersonId?.toString() !== deliveryPerson._id.toString()) {
                    throw new BadRequestException('You are not assigned to deliver this order');
                }
            }

            vendorOrder.status = VendorOrderStatus.DELIVERED;
            vendorOrder.deliveredAt = new Date();

            if (vendorOrder.acceptedAt) {
                vendorOrder.estimatedDeliveryMinutes = Math.round((vendorOrder.deliveredAt.getTime() - vendorOrder.acceptedAt.getTime()) / 60000);
            }

            if (uploadedProofIds && uploadedProofIds.length > 0) {
                vendorOrder.deliveryProofImages = uploadedProofIds.map((id: string) => new Types.ObjectId(id));
            }

            vendorOrder.paymentStatus = PaymentStatus.PAID;

            vendorOrder.items.forEach(item => {
                item.status = OrderItemStatus.DELIVERED;
            });
            vendorOrder.markModified('items');
            await vendorOrder.save({ session });

            const mainOrder = await this.quickOrderModel.findById(vendorOrder.quickOrderId).session(session);
            if (mainOrder) {
                mainOrder.items.forEach(item => {
                    if (item.vendorId.toString() === vendorOrder.vendorId.toString()) {
                        item.status = OrderItemStatus.DELIVERED;
                    }
                });
                mainOrder.markModified('items');

                const allVendorOrders = await this.vendorOrderModel.find({ quickOrderId: mainOrder._id }).session(session);
                const allDelivered = allVendorOrders.every(vo => vo.status === VendorOrderStatus.DELIVERED);

                if (allDelivered) {
                    mainOrder.status = QuickOrderStatus.DELIVERED;
                    mainOrder.paymentStatus = PaymentStatus.PAID;

                    // Send delivery notification to user
                    await this.notificationService.sendNotification({
                        receiverId: mainOrder.customerId.toString(),
                        type: NotificationType.TRANSACTIONAL,
                        priority: NotificationPriority.HIGH,
                        title: 'Order Delivered',
                        body: `Your quick delivery order #${mainOrder._id.toString().substring(0, 8)} has been delivered. Enjoy!`,
                        moduleType: NotificationModuleType.ORDER
                    });
                    await new this.notificationModel({
                        receiverId: mainOrder.customerId,
                        type: NotificationType.TRANSACTIONAL,
                        priority: NotificationPriority.HIGH,
                        title: 'Order Delivered',
                        body: `Your quick delivery order #${mainOrder._id.toString().substring(0, 8)} has been delivered. Enjoy!`,
                        moduleType: NotificationModuleType.ORDER
                    }).save({ session });

                } else if (mainOrder.status !== QuickOrderStatus.PARTIALLY_CANCELLED && mainOrder.status !== QuickOrderStatus.CANCELLED) {
                    mainOrder.status = QuickOrderStatus.PARTIALLY_DELIVERED;
                }

                await mainOrder.save({ session });
            }

            if (role === 'DELIVERY_PERSON') {
                const vendorUser: any = await this.vendorModel.findById(vendorOrder.vendorId).session(session);
                if (vendorUser && vendorUser.userId) {
                    await this.notificationService.sendNotification({
                        receiverId: vendorUser.userId.toString(),
                        type: NotificationType.TRANSACTIONAL,
                        priority: NotificationPriority.NORMAL,
                        title: 'Delivery Completed',
                        body: `The delivery person has delivered order #${vendorOrder._id.toString().substring(0, 8)}.`,
                        moduleType: NotificationModuleType.ORDER
                    });
                    await new this.notificationModel({
                        receiverId: vendorUser.userId,
                        type: NotificationType.TRANSACTIONAL,
                        priority: NotificationPriority.NORMAL,
                        title: 'Delivery Completed',
                        body: `The delivery person has delivered order #${vendorOrder._id.toString().substring(0, 8)}.`,
                        moduleType: NotificationModuleType.ORDER
                    }).save({ session });
                }
            }

            await session.commitTransaction();
            return { message: 'Order marked as delivered successfully', order: vendorOrder };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }


    async cancelVendorOrder(vendorId: string, orderId: string, reason?: string) {
        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            const vendorOrder = await this.vendorOrderModel.findOne({ _id: new Types.ObjectId(orderId), vendorId: new Types.ObjectId(vendorId) }).session(session);
            if (!vendorOrder) throw new NotFoundException('Vendor order not found');

            if (vendorOrder.status === VendorOrderStatus.DELIVERED) {
                throw new BadRequestException('Cannot cancel a delivered order');
            }
            if (vendorOrder.status === VendorOrderStatus.CANCELLED) {
                throw new BadRequestException('Order is already cancelled');
            }

            vendorOrder.status = VendorOrderStatus.CANCELLED;
            vendorOrder.cancelledAt = new Date();
            vendorOrder.cancelledReason = reason || 'Cancelled by Vendor';
            vendorOrder.items.forEach(item => {
                if (item.status !== OrderItemStatus.DELIVERED && item.status !== OrderItemStatus.RETURNED) {
                    item.status = OrderItemStatus.CANCELLED;
                    item.cancelledAt = new Date();
                    item.cancellationReason = reason || 'Cancelled by Vendor';
                }
            });
            vendorOrder.markModified('items');
            await vendorOrder.save({ session });

            const mainOrder = await this.quickOrderModel.findById(vendorOrder.quickOrderId).session(session);
            if (mainOrder) {
                mainOrder.status = QuickOrderStatus.PARTIALLY_CANCELLED;
                mainOrder.items.forEach(item => {
                    if (item.vendorId.toString() === vendorId && item.status !== OrderItemStatus.DELIVERED && item.status !== OrderItemStatus.RETURNED) {
                        item.status = OrderItemStatus.CANCELLED;
                        item.cancelledAt = new Date();
                        item.cancellationReason = reason || 'Cancelled by Vendor';
                    }
                });
                mainOrder.markModified('items');
                await mainOrder.save({ session });

                // Refund to wallet if paid via WALLET
                if (mainOrder.paymentMethod === PaymentMethod.WALLET) {
                    const refundAmount = vendorOrder.total;
                    const wallet = await this.walletModel.findOne({ userId: mainOrder.customerId }).session(session);
                    if (wallet) {
                        wallet.balance += refundAmount;
                        wallet.totalCredits += refundAmount;
                        await wallet.save({ session });

                        const walletTx = new this.walletTxModel({
                            walletId: wallet._id,
                            userId: mainOrder.customerId,
                            amount: refundAmount,
                            type: WalletTransactionType.CREDIT,
                            reason: WalletTransactionReason.REFUND,
                            orderId: mainOrder._id,
                            description: `Refund for Cancelled Vendor Order ${vendorOrder._id}`,
                            balanceAfterTransaction: wallet.balance
                        });
                        await walletTx.save({ session });
                    }
                }
            }

            await session.commitTransaction();
            session.endSession();
            return { message: 'Order cancelled successfully', refundAmount: vendorOrder.total };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    // Admin Methods
    async getAdminOrders(page: number, limit: number, status?: QuickOrderStatus, startDate?: string, endDate?: string, deliveryPersonId?: string) {
        const skip = (page - 1) * limit;
        const query: any = {};

        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        } else {
            // Default 1 month
            const defaultDate = new Date();
            defaultDate.setMonth(defaultDate.getMonth() - 1);
            query.createdAt = { $gte: defaultDate };
        }

        let adminQuery = this.quickOrderModel.find(query);

        if (deliveryPersonId) {
            const vendorOrdersByDeliveryPerson = await this.vendorOrderModel.find({ deliveryPersonId: new Types.ObjectId(deliveryPersonId) }).select('quickOrderId').lean();
            const quickOrderIds = vendorOrdersByDeliveryPerson.map(vo => vo.quickOrderId);
            adminQuery = adminQuery.where('_id').in(quickOrderIds);
        }

        const [orders, total] = await Promise.all([
            adminQuery
                .populate('customerId', 'name email phone')
                .populate('vendorOrders')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.quickOrderModel.countDocuments(query)
        ]);

        return {
            orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async cancelOrderAsAdmin(orderId: string, reason?: string) {
        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            const mainOrder = await this.quickOrderModel.findById(orderId).session(session);
            if (!mainOrder) throw new NotFoundException('Order not found');

            if (mainOrder.status === QuickOrderStatus.DELIVERED) {
                throw new BadRequestException('Cannot cancel a delivered order');
            }
            if (mainOrder.status === QuickOrderStatus.CANCELLED) {
                throw new BadRequestException('Order is already cancelled');
            }

            mainOrder.status = QuickOrderStatus.CANCELLED;
            mainOrder.items.forEach(item => {
                if (item.status !== OrderItemStatus.DELIVERED && item.status !== OrderItemStatus.RETURNED) {
                    item.status = OrderItemStatus.CANCELLED;
                    item.cancelledAt = new Date();
                    item.cancellationReason = reason || 'Cancelled by Admin';
                }
            });
            mainOrder.markModified('items');
            await mainOrder.save({ session });

            // Cancel all vendor orders
            const vendorOrdersToCancel = await this.vendorOrderModel.find({ _id: { $in: mainOrder.vendorOrders }, status: { $ne: VendorOrderStatus.DELIVERED } }).session(session);
            for (const vo of vendorOrdersToCancel) {
                vo.status = VendorOrderStatus.CANCELLED;
                vo.cancelledAt = new Date();
                vo.cancelledReason = reason || 'Cancelled by Admin';
                vo.items.forEach(item => {
                    if (item.status !== OrderItemStatus.DELIVERED && item.status !== OrderItemStatus.RETURNED) {
                        item.status = OrderItemStatus.CANCELLED;
                        item.cancelledAt = new Date();
                        item.cancellationReason = reason || 'Cancelled by Admin';
                    }
                });
                vo.markModified('items');
                await vo.save({ session });
            }

            // Refund if WALLET
            if (mainOrder.paymentMethod === PaymentMethod.WALLET) {
                const refundAmount = mainOrder.grandTotal;
                const wallet = await this.walletModel.findOne({ userId: mainOrder.customerId }).session(session);
                if (wallet) {
                    wallet.balance += refundAmount;
                    wallet.totalCredits += refundAmount;
                    await wallet.save({ session });

                    const walletTx = new this.walletTxModel({
                        walletId: wallet._id,
                        userId: mainOrder.customerId,
                        amount: refundAmount,
                        type: WalletTransactionType.CREDIT,
                        reason: WalletTransactionReason.REFUND,
                        orderId: mainOrder._id,
                        description: `Refund for Cancelled Order ${mainOrder._id} by Admin`,
                        balanceAfterTransaction: wallet.balance
                    });
                    await walletTx.save({ session });
                }
            }

            await session.commitTransaction();
            session.endSession();
            return { message: 'Order cancelled successfully', refundAmount: mainOrder.grandTotal };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    // Delivery Person Methods
    async getDeliveryPersonOrders(deliveryUserId: string, page: number, limit: number, status?: VendorOrderStatus) {
        const deliveryPerson = await this.deliveryPersonModel.findOne({ userId: new Types.ObjectId(deliveryUserId) }).lean();
        if (!deliveryPerson) {
            throw new NotFoundException('Delivery person profile not found');
        }

        const skip = (page - 1) * limit;
        const query: any = { deliveryPersonId: deliveryPerson._id };
        if (status) query.status = status;

        const [orders, total] = await Promise.all([
            this.vendorOrderModel.find(query)
                .populate('vendorId', 'businessName email phone location')
                .populate({
                    path: 'quickOrderId',
                    select: 'customerId addressId paymentMethod paymentStatus',
                    populate: [
                        { path: 'customerId', select: 'name email phone' },
                        { path: 'addressId' }
                    ]
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.vendorOrderModel.countDocuments(query)
        ]);

        return {
            orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
}