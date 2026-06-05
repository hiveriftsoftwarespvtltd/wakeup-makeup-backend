import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { ApiResponse } from 'src/common/responses/api-response';
import { Coupon, CouponDocument, CouponType } from 'src/coupon/schema/coupon.schema';
import { CouponUsage, CouponUsageDocument } from 'src/coupon/schema/coupon-usage.schema';
import {
  ServiceBooking,
  ServiceBookingDocument,
  BookingStatus,
} from './schema/service-booking.schema';
import { Service, ServiceDocument } from './schema/service.schema';
import { ServiceStaff, ServiceStaffDocument } from './schema/service-staff.schema';
import { User, UserDocument } from 'src/user/schema/user.schema';
import { ServiceProvider, ServiceProviderDocument } from './schema/service-provider.schema';
import { CreateBookingDTO, RescheduleBookingDTO } from './dto/service.dto';
import { calculateEndTime, safeSendMail, sendMail, toMinutes, toTimeString } from 'src/utils/helper';
import { ServiceService } from './service.service';
import { bookingCancelledTemplate, bookingCompletedTemplate, bookingRescheduledTemplate } from 'src/utils/service.email.template';

@Injectable()
export class ServiceBookingService {
  constructor(
    @InjectModel(ServiceBooking.name)
    private serviceBookingModel: Model<ServiceBookingDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(ServiceStaff.name)
    private serviceStaffModel: Model<ServiceStaffDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    @InjectModel(CouponUsage.name)
    private couponUsageModel: Model<CouponUsageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ServiceProvider.name) private providerModel: Model<ServiceProviderDocument>,
    private service: ServiceService,
    @InjectConnection() private connection: Connection,
  ) { }

  // async createBooking(userId: string, dto: CreateBookingDTO) {
  //   const session = await this.connection.startSession();
  //   try {
  //     session.startTransaction();

  //     // Validate service
  //     const service = await this.serviceModel
  //       .findById(new Types.ObjectId(dto.serviceId))
  //       .session(session);

  //     if (!service || !service.isActive) {
  //       throw new NotFoundException('Service not found or inactive');
  //     }

  //     // Validate staff belongs to provider (only if staffId is provided in DTO, otherwise might handle differently)
  //     const staff = await this.serviceStaffModel
  //       .findOne({
  //         _id: new Types.ObjectId(dto.staffId),
  //         providerId: service.providerId,
  //         isActive: true,
  //       })
  //       .session(session);

  //     if (!staff) {
  //       throw new NotFoundException('Staff not found or inactive');
  //     }

  //     // Check slot availability
  //     const bookingDate = new Date(dto.bookingDate);
  //     const startOfDay = new Date(bookingDate);
  //     startOfDay.setHours(0, 0, 0, 0);
  //     const endOfDay = new Date(bookingDate);
  //     endOfDay.setHours(23, 59, 59, 999);

  //     const conflicting = await this.serviceBookingModel
  //       .findOne({
  //         staffId: staff._id,
  //         bookingDate: { $gte: startOfDay, $lte: endOfDay },
  //         slotStartTime: dto.slotStartTime,
  //         bookingStatus: {
  //           $in: [
  //             BookingStatus.PENDING,
  //             BookingStatus.CONFIRMED,
  //             BookingStatus.ONGOING,
  //           ],
  //         },
  //       })
  //       .session(session);

  //     if (conflicting) {
  //       throw new BadRequestException('This slot is already booked');
  //     }

  //     // Price calculation
  //     const subtotal = service.offeredPrice || service.sellingPrice;
  //     let couponDiscount = 0;
  //     let couponId: Types.ObjectId | undefined;

  //     // Apply coupon if provided
  //     if (dto.couponCode) {
  //       const coupon = await this.couponModel
  //         .findOne({
  //           code: dto.couponCode.trim().toUpperCase(),
  //           isActive: true,
  //         })
  //         .session(session);

  //       if (!coupon) {
  //         throw new BadRequestException('Coupon not found');
  //       }

  //       const now = new Date();
  //       if (coupon.startsAt && now < coupon.startsAt) {
  //         throw new BadRequestException('Coupon not started yet');
  //       }
  //       if (coupon.expiresAt && now >= coupon.expiresAt) {
  //         throw new BadRequestException('Coupon expired');
  //       }
  //       if (
  //         coupon.totalUsageLimit > 0 &&
  //         coupon.totalUsed >= coupon.totalUsageLimit
  //       ) {
  //         throw new BadRequestException('Coupon usage limit exceeded');
  //       }

  //       const userCouponUsage = await this.couponUsageModel.countDocuments({
  //         userId: new Types.ObjectId(userId),
  //         couponId: coupon._id,
  //       });

  //       if (
  //         coupon.usageLimitPerUser > 0 &&
  //         userCouponUsage >= coupon.usageLimitPerUser
  //       ) {
  //         throw new BadRequestException('You already used this coupon');
  //       }

  //       if (
  //         coupon.minimumOrderAmount > 0 &&
  //         subtotal < coupon.minimumOrderAmount
  //       ) {
  //         throw new BadRequestException(
  //           `Minimum order amount should be ₹${coupon.minimumOrderAmount}`,
  //         );
  //       }

  //       if (coupon.type === CouponType.PERCENTAGE) {
  //         couponDiscount = (subtotal * coupon.value) / 100;
  //         if (coupon.maximumDiscount && couponDiscount > coupon.maximumDiscount) {
  //           couponDiscount = coupon.maximumDiscount;
  //         }
  //       } else {
  //         couponDiscount = coupon.value;
  //       }

  //       if (couponDiscount > subtotal) {
  //         couponDiscount = subtotal;
  //       }

  //       // Increment coupon usage
  //       coupon.totalUsed += 1;
  //       await coupon.save({ session });

  //       couponId = coupon._id as Types.ObjectId;
  //     }

  //     const totalAmount = subtotal - couponDiscount;

  //     // Create booking
  //     const [booking] = await this.serviceBookingModel.create(
  //       [
  //         {
  //           userId: new Types.ObjectId(userId),
  //           providerId: service.providerId,
  //           staffId: staff._id,
  //           serviceId: service._id,
  //           bookingDate: bookingDate,
  //           slotStartTime: dto.slotStartTime,
  //           slotEndTime: dto.slotEndTime,
  //           serviceAddress: dto.serviceAddress,
  //           subtotal,
  //           couponDiscount,
  //           influencerDiscount: 0,
  //           platformCommission: 0,
  //           totalAmount,
  //           bookingStatus: BookingStatus.PENDING,
  //         },
  //       ],
  //       { session },
  //     );

  //     // Record coupon usage if applied
  //     if (couponId) {
  //       await this.couponUsageModel.create(
  //         [
  //           {
  //             couponId,
  //             userId: new Types.ObjectId(userId),
  //             orderId: booking._id,
  //             usedCount: 1,
  //           },
  //         ],
  //         { session },
  //       );
  //     }

  //     await session.commitTransaction();

  //     // Send initial email (Booking Received)
  //     const user = await this.userModel.findById(userId);
  //     if (user && user.email) {
  //       try {
  //         const html = `
  //           <h2>Booking Received</h2>
  //           <p>Hi ${user.name || 'User'},</p>
  //           <p>Your booking for <b>${service.title}</b> is currently pending confirmation from the provider.</p>
  //           <p>Date: ${bookingDate.toLocaleDateString()}</p>
  //           <p>Time: ${dto.slotStartTime} - ${dto.slotEndTime}</p>
  //           <p>We will notify you once it is confirmed.</p>
  //         `;
  //         await sendMail(user.email, 'Your Booking is Pending', html);
  //       } catch (err) {
  //         console.error('Failed to send booking received email:', err);
  //       }
  //     }

  //     return ApiResponse.success('Booking created successfully', booking);
  //   } catch (error) {
  //     await session.abortTransaction();
  //     throw error;
  //   } finally {
  //     await session.endSession();
  //   }
  // }

  async createBooking(
    userId: string,
    dto: CreateBookingDTO,
  ) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const service = await this.serviceModel
        .findById(dto.serviceId)
        .session(session);

      if (!service || !service.isActive) {
        throw new NotFoundException(
          'Service not found or inactive',
        );
      }

      const user = await this.userModel.findById(new Types.ObjectId(userId)).session(session);

      if (!user) {
        throw new NotFoundException(
          'User not found or inactive',
        );
      }

      const staff = await this.serviceStaffModel
        .findOne({
          _id: new Types.ObjectId(dto.staffId),
          providerId: service.providerId,
          isActive: true,
        })
        .session(session);

      if (!staff) {
        throw new NotFoundException(
          'Staff not found or inactive',
        );
      }

      // Validate staff skill
      const canPerformService = staff.skills.some(
        (skill) =>
          skill.toLowerCase() ===
          service.title.toLowerCase(),
      );

      if (!canPerformService) {
        throw new BadRequestException(
          'Selected staff cannot perform this service',
        );
      }

      // Generate slot end time from service duration
      const startMinutes = toMinutes(
        dto.slotStartTime,
      );

      const slotEndTime = toTimeString(
        startMinutes + service.durationMinutes,
      );

      // Verify slot exists and staff is available
      const availableSlotsResponse =
        await this.service.getAvailableSlots(
          service.providerId.toString(),
          service._id.toString(),
          dto.bookingDate,
        );

      const availableSlots =
        availableSlotsResponse.data || [];

      const selectedSlot = availableSlots.find(
        (slot) =>
          slot.startTime === dto.slotStartTime &&
          slot.availableStaff.some(
            (s) =>
              s._id.toString() ===
              staff._id.toString(),
          ),
      );

      if (!selectedSlot) {
        throw new BadRequestException(
          'Selected slot is not available',
        );
      }

      const bookingDate = new Date(dto.bookingDate);

      const startOfDay = new Date(bookingDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(bookingDate);
      endOfDay.setHours(23, 59, 59, 999);

      const staffBookings =
        await this.serviceBookingModel
          .find({
            staffId: staff._id,
            bookingDate: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
            bookingStatus: {
              $in: [
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
                BookingStatus.ONGOING,
              ],
            },
          })
          .session(session);

      const conflictingBooking =
        staffBookings.find((booking) => {
          const bookingStart = toMinutes(
            booking.slotStartTime,
          );

          const bookingEnd = toMinutes(
            booking.slotEndTime,
          );

          return (
            startMinutes < bookingEnd &&
            startMinutes +
            service.durationMinutes >
            bookingStart
          );
        });

      if (conflictingBooking) {
        throw new BadRequestException(
          'Selected slot is already booked',
        );
      }

      const subtotal =
        service.offeredPrice ||
        service.sellingPrice;

      let couponDiscount = 0;
      let couponId: Types.ObjectId | undefined;

      // ---------------- COUPON LOGIC ----------------

      if (dto.couponCode) {
        const coupon = await this.couponModel
          .findOne({
            code: dto.couponCode
              .trim()
              .toUpperCase(),
            isActive: true,
          })
          .session(session);

        if (!coupon) {
          throw new BadRequestException(
            'Coupon not found',
          );
        }

        const now = new Date();

        if (
          coupon.startsAt &&
          now < coupon.startsAt
        ) {
          throw new BadRequestException(
            'Coupon not started yet',
          );
        }

        if (
          coupon.expiresAt &&
          now >= coupon.expiresAt
        ) {
          throw new BadRequestException(
            'Coupon expired',
          );
        }

        if (
          coupon.totalUsageLimit > 0 &&
          coupon.totalUsed >=
          coupon.totalUsageLimit
        ) {
          throw new BadRequestException(
            'Coupon usage limit exceeded',
          );
        }

        const userUsage =
          await this.couponUsageModel.countDocuments({
            userId: new Types.ObjectId(userId),
            couponId: coupon._id,
          });

        if (
          coupon.usageLimitPerUser > 0 &&
          userUsage >=
          coupon.usageLimitPerUser
        ) {
          throw new BadRequestException(
            'You already used this coupon',
          );
        }

        if (
          coupon.minimumOrderAmount > 0 &&
          subtotal <
          coupon.minimumOrderAmount
        ) {
          throw new BadRequestException(
            `Minimum order amount should be ₹${coupon.minimumOrderAmount}`,
          );
        }

        if (
          coupon.type ===
          CouponType.PERCENTAGE
        ) {
          couponDiscount =
            (subtotal * coupon.value) / 100;

          if (
            coupon.maximumDiscount &&
            couponDiscount >
            coupon.maximumDiscount
          ) {
            couponDiscount =
              coupon.maximumDiscount;
          }
        } else {
          couponDiscount = coupon.value;
        }

        couponDiscount = Math.min(
          couponDiscount,
          subtotal,
        );

        coupon.totalUsed += 1;

        await coupon.save({ session });

        couponId =
          coupon._id as Types.ObjectId;
      }

      const totalAmount =
        subtotal - couponDiscount;

      const [booking] =
        await this.serviceBookingModel.create(
          [
            {
              userId:
                new Types.ObjectId(userId),
              providerId:
                service.providerId,
              serviceId: service._id,
              staffId: staff._id,

              bookingDate,

              slotStartTime:
                dto.slotStartTime,

              slotEndTime,

              serviceAddress:
                dto.serviceAddress,

              subtotal,
              couponDiscount,
              influencerDiscount: 0,
              platformCommission: 0,
              totalAmount,

              bookingStatus:
                BookingStatus.CONFIRMED,
            },
          ],
          { session },
        );

      if (couponId) {
        await this.couponUsageModel.create(
          [
            {
              couponId,
              userId:
                new Types.ObjectId(userId),
              orderId: booking._id,
              usedCount: 1,
            },
          ],
          { session },
        );
      }

      await session.commitTransaction();
      safeSendMail(
        user.email,
        'Booking Confirmed - WakeUp MakeUp',
        bookingCompletedTemplate(user.name || '', {
          serviceTitle: service.title,
          providerName: 'Provider Name',
          staffName: staff.name,
          bookingDate: dto.bookingDate,
          bookingId: booking._id.toString(),
          totalAmount,
        }),
      ).then((res) => {
        if (!res.success) {
          console.log('Booking email failed but booking is safe');
        }
      });

      return ApiResponse.success('Booking created successfully', booking);

      // return ApiResponse.success(
      //   'Booking created successfully',
      //   booking,
      // );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // async cancelBooking(userId: string, bookingId: string) {
  //   const booking = await this.serviceBookingModel.findById(bookingId);

  //   if (!booking) {
  //     throw new NotFoundException('Booking not found');
  //   }

  //   const user = await this.userModel.findById(new Types.ObjectId(userId))
  //   if(!user){
  //     throw new NotFoundException('User not found');
  //   }


  //   if (booking.userId.toString() !== userId.toString()) {
  //     // In a real app, an admin/provider might also be able to cancel.
  //     // For now, assuming user cancels their own booking.
  //     throw new BadRequestException('You are not authorized to cancel this booking');
  //   }

  //   if (booking.bookingStatus === BookingStatus.CANCELLED || booking.bookingStatus === BookingStatus.COMPLETED) {
  //     throw new BadRequestException(`Cannot cancel booking in ${booking.bookingStatus} status`);
  //   }

  //   booking.bookingStatus = BookingStatus.CANCELLED;
  //   await booking.save();

  //    safeSendMail(
  //       user.email,
  //       'Booking Cancelled - WakeUp MakeUp',
  //       bookingCancelledTemplate(user.name || '', {
  //         serviceTitle: booking.serviceId.title,
  //         providerName: 'Provider Name',
  //         staffName: staff.name,
  //         bookingDate: booking.bookingDate,
  //         bookingId: booking._id.toString(),
  //         totalAmount,
  //       }),
  //     ).then((res) => {
  //       if (!res.success) {
  //         console.log('Booking email failed but booking is safe');
  //       }
  //     });

  //   return ApiResponse.success('Booking cancelled successfully', booking);
  // }

  async cancelBooking(userId: string, bookingId: string) {
    const booking = await this.serviceBookingModel
      .findById(bookingId)
      .populate('serviceId', 'title')
      .populate('providerId', 'businessName')
      .populate('staffId', 'name');

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (booking.userId.toString() !== userId.toString()) {
      throw new BadRequestException('You are not authorized to cancel this booking');
    }

    if (
      booking.bookingStatus === BookingStatus.CANCELLED ||
      booking.bookingStatus === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        `Cannot cancel booking in ${booking.bookingStatus} status`,
      );
    }

    booking.bookingStatus = BookingStatus.CANCELLED;
    await booking.save();

    // ✅ Safe email (non-blocking)
    safeSendMail(
      user.email,
      'Booking Cancelled - WakeUp MakeUp',
      bookingCancelledTemplate(user.name || '', {
        serviceTitle: (booking.serviceId as any)?.title || 'Service',
        providerName: (booking.providerId as any)?.businessName || 'Provider',
        bookingDate: booking.bookingDate.toDateString(),
        slotStartTime: booking.slotStartTime,
        slotEndTime: booking.slotEndTime,
        bookingId: booking._id.toString(),
      })
    ).then((res) => {
      if (!res.success) {
        console.log('Booking cancellation email failed but flow is safe');
      }
    });

    return ApiResponse.success('Booking cancelled successfully', booking);
  }

  async rescheduleBooking(
    userId: string,
    bookingId: string,
    dto: RescheduleBookingDTO,
  ) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const booking = await this.serviceBookingModel
        .findById(bookingId)
        .session(session);

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.userId.toString() !== userId.toString()) {
        throw new BadRequestException(
          'You are not authorized to reschedule this booking',
        );
      }

      if (
        booking.bookingStatus === BookingStatus.CANCELLED ||
        booking.bookingStatus === BookingStatus.COMPLETED
      ) {
        throw new BadRequestException(
          `Cannot reschedule a ${booking.bookingStatus} booking`,
        );
      }

      const service = await this.serviceModel
        .findById(booking.serviceId)
        .session(session);

      if (!service) {
        throw new NotFoundException('Service not found');
      }

      // DATE RANGE
      const bookingDate = new Date(dto.bookingDate);

      const startOfDay = new Date(bookingDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(bookingDate);
      endOfDay.setHours(23, 59, 59, 999);

      // CONFLICT CHECK
      const conflicting = await this.serviceBookingModel
        .findOne({
          _id: { $ne: booking._id },
          staffId: booking.staffId,
          bookingDate: { $gte: startOfDay, $lte: endOfDay },
          slotStartTime: dto.slotStartTime,
          bookingStatus: {
            $in: [
              BookingStatus.PENDING,
              BookingStatus.CONFIRMED,
              BookingStatus.ONGOING,
            ],
          },
        })
        .session(session);

      if (conflicting) {
        throw new BadRequestException(
          'The selected slot is already booked for this staff member',
        );
      }

      const slotEndTime = calculateEndTime(
        dto.slotStartTime,
        service.durationMinutes,
      );

      // STORE OLD VALUES FOR EMAIL
      const oldDate = booking.bookingDate;
      const oldTime = booking.slotStartTime;

      booking.bookingDate = bookingDate;
      booking.slotStartTime = dto.slotStartTime;
      booking.slotEndTime = slotEndTime;

      booking.bookingStatus = BookingStatus.CONFIRMED;
      booking.isRescheduled = true;
      booking.rescheduledAt = new Date();

      await booking.save({ session });

      await session.commitTransaction();

      // 🔥 NON-BLOCKING EMAIL (AFTER COMMIT)
      safeSendMail(
        '', // user email (fetch user if needed)
        'Booking Rescheduled - WakeUp MakeUp',
        bookingRescheduledTemplate('', {
          serviceTitle: (service as any)?.title || 'Service',
          providerName: 'Provider Name',
          oldDate: new Date(oldDate).toDateString(),
          oldTime: oldTime,
          newDate: bookingDate.toDateString(),
          newTime: dto.slotStartTime,
          bookingId: booking._id.toString(),
        }),
      ).then((res) => {
        if (!res.success) {
          console.log('Reschedule email failed but booking is safe');
        }
      });

      return ApiResponse.success(
        'Booking rescheduled successfully',
        booking,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async confirmBooking(providerId: string, bookingId: string) {
    const booking = await this.serviceBookingModel.findById(bookingId).populate('serviceId');

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Optional: check if the providerId matches booking.providerId if needed

    if (booking.bookingStatus !== BookingStatus.PENDING && booking.bookingStatus !== ('RESCHEDULED' as any)) {
      throw new BadRequestException(`Cannot confirm booking from status ${booking.bookingStatus}`);
    }

    booking.bookingStatus = BookingStatus.CONFIRMED;
    await booking.save();

    // Send confirmation email
    const user = await this.userModel.findById(booking.userId);
    if (user && user.email) {
      try {
        const serviceData: any = booking.serviceId;
        const html = `
          <h2>Booking Confirmed!</h2>
          <p>Hi ${user.name || 'User'},</p>
          <p>Great news! Your booking for <b>${serviceData?.title || 'a service'}</b> has been confirmed by the provider.</p>
          <p>Date: ${new Date(booking.bookingDate).toLocaleDateString()}</p>
          <p>Time: ${booking.slotStartTime} - ${booking.slotEndTime}</p>
          <p>Thank you for booking with us!</p>
        `;
        await sendMail(user.email, 'Your Booking is Confirmed', html);
      } catch (err) {
        console.error('Failed to send confirmation email:', err);
      }
    }

    return ApiResponse.success('Booking confirmed successfully', booking);
  }

  async getUserBookingHistory(
    userId: string,
    status?: string,
    startDateStr?: string,
    endDateStr?: string
  ) {
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (status) {
      filter.bookingStatus = status;
    }

    // Default to last 1 month if no dates provided
    let start = new Date();
    start.setMonth(start.getMonth() - 1);
    let end = new Date();

    if (startDateStr) {
      start = new Date(startDateStr);
    }
    if (endDateStr) {
      end = new Date(endDateStr);
    }

    // Set end of day for the end date to include the whole day
    end.setHours(23, 59, 59, 999);

    filter.bookingDate = {
      $gte: start,
      $lte: end,
    };


    const bookings = await this.serviceBookingModel
      .find(filter)
      .populate('providerId', 'businessName address phone')
      .populate('serviceId', 'title description offeredPrice sellingPrice')
      .populate('staffId', 'name')
      .sort({ bookingDate: -1 })
      .lean();

    return ApiResponse.success('Booking history fetched successfully', bookings);
  }
}
