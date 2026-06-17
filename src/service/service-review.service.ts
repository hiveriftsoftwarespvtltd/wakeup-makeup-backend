import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { ServiceReview, ServiceReviewDocument } from './schema/service-review.schema';
import { ServiceBooking, ServiceBookingDocument, BookingStatus, BookingPaymentStatus } from './schema/service-booking.schema';
import { Service, ServiceDocument } from './schema/service.schema';
import { ServiceProvider, ServiceProviderDocument } from './schema/service-provider.schema';
import { CreateServiceReviewDto, UpdateServiceReviewDto } from './dto/service-review.dto';
import { DocumentService } from 'src/document/document.service';

@Injectable()
export class ServiceReviewService {
  constructor(
    @InjectModel(ServiceReview.name) private reviewModel: Model<ServiceReviewDocument>,
    @InjectModel(ServiceBooking.name) private bookingModel: Model<ServiceBookingDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(ServiceProvider.name) private providerModel: Model<ServiceProviderDocument>,
    private documentService: DocumentService,
    @InjectConnection() private connection: Connection,
  ) { }

  async createReview(userId: string, dto: CreateServiceReviewDto, files?: any[]) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const booking = await this.bookingModel.findOne({
        _id: new Types.ObjectId(dto.bookingId),
        userId: new Types.ObjectId(userId),
        'items.serviceId': new Types.ObjectId(dto.serviceId),
        providerId: new Types.ObjectId(dto.serviceProviderId),
        bookingStatus: BookingStatus.COMPLETED,
        paymentStatus: BookingPaymentStatus.PAID,
      }).session(session);

      if (!booking) {
        throw new BadRequestException('You can only review services that have been completed and paid for.');
      }

      if (booking.paymentStatus !== BookingPaymentStatus.PAID || booking.bookingStatus !== BookingStatus.COMPLETED) {
        throw new BadRequestException('You can only review services that have been completed and paid for.');
      }

      // Check for duplicate review
      const existingReview = await this.reviewModel.findOne({
        userId: new Types.ObjectId(userId),
        bookingId: new Types.ObjectId(dto.bookingId),
        serviceId: new Types.ObjectId(dto.serviceId),
      }).session(session);

      if (existingReview) {
        throw new BadRequestException('You have already reviewed this booking.');
      }

      const imageIds: Types.ObjectId[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          // Document service upload is external, keeping outside transaction safety
          const uploaded = await this.documentService.upload(file, 'service-reviews', userId);
          imageIds.push(new Types.ObjectId(uploaded._id as any));
        }
      }

      const [review] = await this.reviewModel.create([{
        userId: new Types.ObjectId(userId),
        bookingId: new Types.ObjectId(dto.bookingId),
        serviceId: new Types.ObjectId(dto.serviceId),
        serviceProviderId: new Types.ObjectId(dto.serviceProviderId),
        providerRating: dto.providerRating,
        providerReview: dto.providerReview,
        serviceRating: dto.serviceRating,
        serviceReview: dto.serviceReview,
        images: imageIds,
      }], { session });

      await this.updateRatings(dto.serviceId, dto.serviceProviderId, session);

      await session.commitTransaction();
      return review;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateReview(userId: string, reviewId: string, dto: UpdateServiceReviewDto, files?: any[]) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const review = await this.reviewModel.findOne({
        _id: new Types.ObjectId(reviewId),
        userId: new Types.ObjectId(userId),
      }).session(session);

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      if (dto.providerRating !== undefined) review.providerRating = dto.providerRating;
      if (dto.providerReview !== undefined) review.providerReview = dto.providerReview;
      if (dto.serviceRating !== undefined) review.serviceRating = dto.serviceRating;
      if (dto.serviceReview !== undefined) review.serviceReview = dto.serviceReview;

      if (files && files.length > 0) {
        const imageIds: Types.ObjectId[] = [];
        for (const file of files) {
          const uploaded = await this.documentService.upload(file, 'service-reviews', userId);
          imageIds.push(new Types.ObjectId(uploaded._id as any));
        }
        review.images = imageIds;
      }

      await review.save({ session });

      await this.updateRatings(review.serviceId.toString(), review.serviceProviderId.toString(), session);

      await session.commitTransaction();
      return review;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async deleteReview(reviewId: string) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const review = await this.reviewModel.findOne({
        _id: new Types.ObjectId(reviewId),
      }).session(session);

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      // Delete media
      if (review.images && review.images.length > 0) {
        for (const mediaId of review.images) {
          await this.documentService.deleteMedia(mediaId.toString());
        }
      }

      await review.deleteOne({ session });

      await this.updateRatings(review.serviceId.toString(), review.serviceProviderId.toString(), session);

      await session.commitTransaction();
      return { message: 'Review deleted successfully' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getServiceReviews(providerId: string, serviceId: string, userId?: string) {
    const reviews = await this.reviewModel
      .find({
        serviceId: new Types.ObjectId(serviceId),
        serviceProviderId: new Types.ObjectId(providerId),
      })
      .populate('userId', 'name avatar')
      .populate('images', 'url _id publicId')
      .sort({ createdAt: -1 })
      .lean();

    let isReviewed = false;
    let userReview: any = null;

    if (userId) {
      userReview = reviews.find(r => r.userId?._id?.toString() === userId.toString()) || null;
      if (userReview) {
        isReviewed = true;
      }
    }

    return {
      isReviewed,
      userReview,
      reviews,
    };
  }

  async getProviderReviews(providerId: string, userId?: string) {
    const reviews = await this.reviewModel
      .find({
        serviceProviderId: new Types.ObjectId(providerId),
      })
      .populate('userId', 'name avatar')
      .populate('serviceId', 'title images')
      .populate('images', 'url _id publicId')
      .sort({ createdAt: -1 })
      .lean();

    let isReviewed = false;
    let userReview: any = null;

    if (userId) {
      userReview = reviews.find(r => r.userId?._id?.toString() === userId.toString()) || null;
      if (userReview) {
        isReviewed = true;
      }
    }

    return {
      isReviewed,
      userReview,
      reviews,
    };
  }

  private async updateRatings(serviceId: string, providerId: string, session?: any) {
    // Update Service Rating
    const serviceStats = await this.reviewModel.aggregate([
      { $match: { serviceId: new Types.ObjectId(serviceId) } },
      {
        $group: {
          _id: '$serviceId',
          averageRating: { $avg: '$serviceRating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]).session(session);

    const serviceAverage = serviceStats.length > 0 ? Number(serviceStats[0].averageRating.toFixed(1)) : 0;
    const serviceTotal = serviceStats.length > 0 ? serviceStats[0].totalReviews : 0;

    await this.serviceModel.findByIdAndUpdate(serviceId, {
      averageRating: serviceAverage,
      totalReviews: serviceTotal,
    }, { session });

    // Update Provider Rating
    const providerStats = await this.reviewModel.aggregate([
      { $match: { serviceProviderId: new Types.ObjectId(providerId) } },
      {
        $group: {
          _id: '$serviceProviderId',
          averageRating: { $avg: '$providerRating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]).session(session);

    const providerAverage = providerStats.length > 0 ? Number(providerStats[0].averageRating.toFixed(1)) : 0;
    const providerTotal = providerStats.length > 0 ? providerStats[0].totalReviews : 0;

    await this.providerModel.findByIdAndUpdate(providerId, {
      rating: providerAverage,
      totalReviews: providerTotal,
    }, { session });
  }
}
