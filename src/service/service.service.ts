import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Service, ServiceDocument } from './schema/service.schema';
import { Connection, Model, Types } from 'mongoose';
import {
  ProviderSubscription,
  ProviderSubscriptionDocument,
  ServiceSubscriptionStatus,
} from './schema/provider-subscription.schema';
import {
  ProviderAvailability,
  ProviderAvailabilityDocument,
  WeekDay,
} from './schema/service-availability.schema';
import {
  ServiceBooking,
  ServiceBookingDocument,
  BookingStatus,
  BookingPaymentStatus,
} from './schema/service-booking.schema';
import {
  ServiceCategory,
  ServiceCategoryDocument,
} from './schema/service-category.schema';
import { ServiceLead, ServiceLeadDocument, ServiceLeadStatus } from './schema/service-lead.schema';
import {
  ServiceProviderPayoutDocument,
  ServicerProviderPayout,
  ServiceProviderPayoutStatus,
} from './schema/service-provider-payout.schema';
import {
  ServiceProviderWallet,
  ServiceProviderWalletDocument,
} from './schema/service-provider-wallet.schema';
import {
  ServiceReview,
  ServiceReviewDocument,
} from './schema/service-review.schema';
import { ServiceSlot, ServiceSlotDocument } from './schema/service-slot.schema';
import {
  ServiceStaff,
  ServiceStaffDocument,
} from './schema/service-staff.schema';
import {
  ServiceSubscriptionPlan,
  ServiceSubscriptionPlanDocument,
} from './schema/service-subscription.schema';
import {
  ServiceProvider,
  ServiceProviderDocument,
  ServiceProviderVerificationStatus,
} from './schema/service-provider.schema';
import {
  CreateServiceCategoryDTO,
  CreateServiceSubscriptionPlanDTO,
  UpdateServiceCategoryDTO,
  UpdateServiceSubscriptionPlanDTO,
  CreateServiceProviderDTO,
  UpdateServiceProviderDTO,
  CreateServiceDTO,
  UpdateServiceDTO,
  CreateStaffDTO,
  UpdateStaffDTO,
  UpdateAvailabilityDTO,
  CreateBookingDTO,
  UpdateBookingStatusDTO,
  CreateReviewDTO,
  CreateLeadDTO,
  RequestPayoutDTO,
  ProcessPayoutDTO,
  CreateProviderAvailabilityDTO,
} from './dto/service.dto';
import { DocumentService } from 'src/document/document.service';
import { ApiResponse } from 'src/common/responses/api-response';
import { MediaFolderName } from 'src/constants';
import { getWeekDay, toSlug } from 'src/utils/helper';
import { User, UserDocument, UserRole } from 'src/user/schema/user.schema';
import { Coupon, CouponDocument, CouponType } from 'src/coupon/schema/coupon.schema';
import { CouponUsage, CouponUsageDocument } from 'src/coupon/schema/coupon-usage.schema';

@Injectable()
export class ServiceService {
  constructor(

    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(ProviderSubscription.name)
    private providerSubscriptionModel: Model<ProviderSubscriptionDocument>,
    @InjectModel(ProviderAvailability.name)
    private providerAvailabilityModel: Model<ProviderAvailabilityDocument>,
    @InjectModel(ServiceBooking.name)
    private serviceBookingModel: Model<ServiceBookingDocument>,
    @InjectModel(ServiceCategory.name)
    private serviceCategoryModel: Model<ServiceCategoryDocument>,
    @InjectModel(ServiceLead.name)
    private serviceLeadModel: Model<ServiceLeadDocument>,
    @InjectModel(ServicerProviderPayout.name)
    private serviceProviderPayoutModel: Model<ServiceProviderPayoutDocument>,
    @InjectModel(ServiceProviderWallet.name)
    private serviceProviderWalletModel: Model<ServiceProviderWalletDocument>,
    @InjectModel(ServiceReview.name)
    private serviceReviewModel: Model<ServiceReviewDocument>,
    @InjectModel(ServiceSlot.name)
    private serviceSlotModel: Model<ServiceSlotDocument>,
    @InjectModel(ServiceStaff.name)
    private serviceStaffModel: Model<ServiceStaffDocument>,
    @InjectModel(ServiceSubscriptionPlan.name)
    private serviceSubscriptionModel: Model<ServiceSubscriptionPlanDocument>,
    @InjectModel(ServiceProvider.name)
    private serviceProviderModel: Model<ServiceProviderDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Coupon.name)
    private couponModel: Model<CouponDocument>,
    @InjectModel(CouponUsage.name)
    private couponUsageModel: Model<CouponUsageDocument>,
    private documentService: DocumentService,
    @InjectConnection() private connection: Connection,
  ) {

  }

  // ===================================================
  // Helper: filter out undefined/null/empty-string fields
  // ===================================================
  private filterDto(dto: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(dto).filter(
        ([_, value]) =>
          value !== undefined &&
          value !== null &&
          !(typeof value === 'string' && value.trim() === ''),
      ),
    );
  }

  // ===================================================
  // Helper: get provider for the logged-in user
  // ===================================================
  private async getProviderByUserId(userId: string) {
    const provider = await this.serviceProviderModel.findOne({
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });
    if (!provider) {
      throw new NotFoundException('Service provider profile not found');
    }
    return provider;
  }

  // ===================================================
  // SERVICE CATEGORY
  // ===================================================

  async createServiceCategory(
    dto: CreateServiceCategoryDTO,
    file: Express.Multer.File,
    userId: string,
  ) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const isAlreadyExist = await this.serviceCategoryModel
        .findOne({
          $or: [{ name: dto.name }, { label: dto.label }],
        })
        .session(session);

      if (isAlreadyExist) {
        throw new BadRequestException('Name or Label already exist');
      }

      let mediaId: Types.ObjectId | undefined;
      if (file) {
        const uploaded = await this.documentService.upload(
          file,
          MediaFolderName.ServiceCategory,
          userId,
          undefined,
          session,
        );
        mediaId = uploaded._id;
      }

      await this.serviceCategoryModel.create(
        [
          {
            name: dto.name,
            label: dto.label,
            description: dto.description,
            image: mediaId,
            isActive: dto?.isActive,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return ApiResponse.success('Service category created successfully');
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateCategory(
    dto: UpdateServiceCategoryDTO,
    file: Express.Multer.File,
    adminId: string,
    serviceCategoryId: string,
  ) {
    const session = await this.connection.startSession();
    let oldImageId: string | null = null;

    try {
      session.startTransaction();

      const serviceCategory = await this.serviceCategoryModel
        .findById(serviceCategoryId)
        .session(session);

      if (!serviceCategory) {
        throw new NotFoundException('Service category not found');
      }

      // Duplicate check
      const conditions: any = [];
      if (dto.name) {
        conditions.push({ name: dto.name });
      }
      if (dto.label) {
        conditions.push({ label: dto.label });
      }

      if (conditions.length > 0) {
        const isAlreadyExist = await this.serviceCategoryModel
          .findOne({
            _id: { $ne: new Types.ObjectId(serviceCategoryId) },
            isDeleted: false,
            isActive: true,
            $or: conditions,
          })
          .session(session);

        if (isAlreadyExist) {
          throw new BadRequestException('Label or name already exists');
        }
      }

      const filtered = this.filterDto(dto);

      if (file) {
        if (serviceCategory.image) {
          oldImageId = serviceCategory.image.toString();
        }

        const uploaded = await this.documentService.upload(
          file,
          MediaFolderName.ServiceCategory,
          adminId,
          undefined,
          session,
        );
        filtered.image = uploaded._id;
      }

      Object.assign(serviceCategory, filtered);
      await serviceCategory.save({ session });
      await session.commitTransaction();

      // Delete old image AFTER successful commit
      if (oldImageId) {
        try {
          await this.documentService.deleteMedia(oldImageId);
        } catch (error) {
          console.error('Failed to delete old category image:', error);
        }
      }

      return ApiResponse.success('Service category updated successfully');
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getAllServiceCategories() {
    const serviceCategories = await this.serviceCategoryModel
      .find({ isDeleted: false })
      .populate('image')
      .lean();
    return ApiResponse.success('All service categories', serviceCategories);
  }

  async serviceCategoryDetails(serviceCategoryId: string) {
    const serviceCategory = await this.serviceCategoryModel
      .findById(new Types.ObjectId(serviceCategoryId))
      .populate('image');
    if (!serviceCategory) {
      throw new NotFoundException('Service category not found');
    }
    return ApiResponse.success('Service category details', serviceCategory);
  }

  async deleteServiceCategory(serviceCategoryId: string) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const serviceCategory = await this.serviceCategoryModel
        .findById(new Types.ObjectId(serviceCategoryId))
        .session(session);

      if (!serviceCategory) {
        throw new NotFoundException('Service category not found');
      }

      const oldImageId = serviceCategory.image
        ? serviceCategory.image.toString()
        : null;

      await serviceCategory.deleteOne({ session });
      await session.commitTransaction();

      if (oldImageId) {
        try {
          await this.documentService.deleteMedia(oldImageId);
        } catch (error) {
          console.error('Failed to delete category image:', error);
        }
      }

      return ApiResponse.success('Service category deleted successfully');
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // ===================================================
  // SERVICE SUBSCRIPTION PLAN
  // ===================================================

  async createServiceSubscriptionPlan(dto: CreateServiceSubscriptionPlanDTO) {
    const isAlreadyExist = await this.serviceSubscriptionModel.findOne({
      $or: [{ name: toSlug(dto.name) }, { label: dto.label }],
    });

    if (isAlreadyExist) {
      throw new BadRequestException('Same name or label already exist');
    }

    await this.serviceSubscriptionModel.create(dto);
    return ApiResponse.success(`Subscription plan ${dto.label} is created`);
  }

  async updateServiceSubscriptionPlan(
    dto: UpdateServiceSubscriptionPlanDTO,
    serviceSubscriptionPlanId: string,
  ) {
    const subscriptionPlan = await this.serviceSubscriptionModel.findById(
      new Types.ObjectId(serviceSubscriptionPlanId),
    );
    if (!subscriptionPlan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const filtered = this.filterDto(dto);

    Object.assign(subscriptionPlan, filtered);
    await subscriptionPlan.save();
    return ApiResponse.success(`Subscription plan updated successfully`);
  }

  async allSubscriptionPlans() {
    const plans = await this.serviceSubscriptionModel
      .find({ isDeleted: false })
      .lean();
    return ApiResponse.success('All subscription plans', plans);
  }

  async subscriptionPlanDetails(subscriptionPlanId: string) {
    const planDetails = await this.serviceSubscriptionModel
      .findById(new Types.ObjectId(subscriptionPlanId))
      .lean();
    if (!planDetails) {
      throw new NotFoundException('Plan not found');
    }
    return ApiResponse.success('Plan Details', planDetails);
  }

  async deletePlan(planId: string) {
    const plan = await this.serviceSubscriptionModel.findById(planId);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    await plan.deleteOne();
    return ApiResponse.success('Plan deleted successfully');
  }

  // ===================================================
  // SERVICE PROVIDER
  // ===================================================

  async registerServiceProvider(
    userId: string,
    dto: CreateServiceProviderDTO,
    file?: Express.Multer.File,
  ) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const user = await this.userModel.findById(new Types.ObjectId(userId))
      if (!user) {
        throw new NotFoundException('User not found')
      }

      // Check if user already has a provider profile
      const existing = await this.serviceProviderModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .session(session);

      if (existing) {
        throw new BadRequestException(
          'You already have a service provider profile',
        );
      }

      const providerData: any = {
        userId: new Types.ObjectId(userId),
        email: user.email,
        ...dto,
      };

      // Upload profile/verification image if provided
      if (file) {
        const uploaded = await this.documentService.upload(
          file,
          MediaFolderName.ServiceProvider,
          userId,
          undefined,
          session,
        );
        providerData.profileImage = uploaded._id;
      }

      const [provider] = await this.serviceProviderModel.create(
        [providerData],
        { session },
      );

      // Create wallet for the provider
      await this.serviceProviderWalletModel.create(
        [
          {
            providerId: provider._id,
            availableBalance: 0,
            pendingBalance: 0,
            totalEarned: 0,
          },
        ],
        { session },
      );

      // Update user role and serviceProviderId
      await this.userModel.updateOne(
        { _id: new Types.ObjectId(userId) },
        {
          $set: {
            // role: UserRole.SERVICE_PROVIDER,
            serviceProviderId: provider._id,
            isServiceProviderOnboardingCompleted: true
          },
        },
        { session },
      );

      await session.commitTransaction();
      return ApiResponse.success(
        'Service provider registered successfully',
        provider,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateServiceProvider(userId: string, dto: UpdateServiceProviderDTO) {
    const provider = await this.getProviderByUserId(userId);
    const filtered = this.filterDto(dto);
    Object.assign(provider, filtered);
    await provider.save();
    return ApiResponse.success(
      'Service provider updated successfully',
      provider,
    );
  }

  async getServiceProviderProfile(userId: string) {
    const provider = await this.serviceProviderModel
      .findOne({
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .populate('userId', 'name email phone avatar');

    if (!provider) {
      throw new NotFoundException('Service provider profile not found');
    }
    return ApiResponse.success('Service provider profile', provider);
  }

  async getServiceProviderById(providerId: string) {
    const provider = await this.serviceProviderModel
      .findById(new Types.ObjectId(providerId))
      .populate('userId', 'name email phone avatar');

    if (!provider || provider.isDeleted) {
      throw new NotFoundException('Service provider not found');
    }
    return ApiResponse.success('Service provider details', provider);
  }

  async listServiceProviders() {
    const providers = await this.serviceProviderModel
      .find({
        isDeleted: false,
        isActive: true,

      })
      .populate('userId', 'name email avatar')
      .sort({ isFeatured: -1, rating: -1 })
      .lean();

    return ApiResponse.success('Service providers', providers);
  }

  // async approveServiceProvider(
  //   providerId: string,
  //   status: ServiceProviderVerificationStatus,
  // ) {
  //   const provider = await this.serviceProviderModel.findById(
  //     new Types.ObjectId(providerId),
  //   );
  //   if (!provider) {
  //     throw new NotFoundException('Service provider not found');
  //   }
  //   provider.verificationStatus = status;
  //   await provider.save();
  //   return ApiResponse.success(
  //     `Service provider ${status.toLowerCase()} successfully`,
  //   );
  // }

  // ===================================================
  // SERVICE CRUD
  // ===================================================

  async approveServiceProvider(
    providerId: string,
    status: ServiceProviderVerificationStatus,
  ) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const provider = await this.serviceProviderModel.findById(
        new Types.ObjectId(providerId),
      ).session(session);

      if (!provider) {
        throw new NotFoundException('Service provider not found');
      }

      provider.verificationStatus = status;
      await provider.save({ session });

      // Only assign free plan when approved
      if (status === ServiceProviderVerificationStatus.APPROVED) {

        // Find free plan
        let freePlan = await this.serviceSubscriptionModel.findOne({
          name: 'free',
          isDeleted: false,
        }).session(session);

        // Create free plan if not exists
        if (!freePlan) {
          [freePlan] = await this.serviceSubscriptionModel.create(
            [
              {
                name: 'free',
                label: 'Free',
                durationDays: -1,
                price: 0,
                maxServices: 5,
                maxStaff: 2,
                monthlyLeadLimit: 2,
                commissionPercentage: 25,
                featuredListing: false,
                prioritySupport: false,
                analyticsAccess: false,
                priorityRank: 1,
                isActive: true,
              },
            ],
            {
              session,
              ordered: true,
            },
          );
        }

        // Check existing subscription
        const existingSubscription =
          await this.providerSubscriptionModel.findOne({
            providerId: provider._id,
            status: ServiceSubscriptionStatus.ACTIVE,
          }).session(session);

        if (!existingSubscription) {
          await this.providerSubscriptionModel.create(
            [
              {
                providerId: provider._id,
                planId: freePlan._id,
                startDate: new Date(),
                endDate:
                  freePlan.durationDays === -1
                    ? undefined
                    : new Date(
                      Date.now() +
                      freePlan.durationDays * 24 * 60 * 60 * 1000,
                    ),
                amountPaid: 0,
                status: ServiceSubscriptionStatus.ACTIVE,
                autoRenew: false,
              },
            ],
            {
              session,
              ordered: true,
            },
          );
        }
      }

      await session.commitTransaction();

      return ApiResponse.success(
        `Service provider ${status.toLowerCase()} successfully`,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }


  async createService(
    userId: string,
    dto: CreateServiceDTO,
    files?: Express.Multer.File[],
  ) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const provider = await this.serviceProviderModel
        .findOne({
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .session(session);

      if (!provider) {
        throw new NotFoundException('Service provider profile not found');
      }

      // Upload images via DocumentService
      const imageIds: Types.ObjectId[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const uploaded = await this.documentService.upload(
            file,
            MediaFolderName.ServiceImages,
            userId,
            undefined,
            session,
          );
          imageIds.push(uploaded._id);
        }
      }

      const [service] = await this.serviceModel.create(
        [
          {
            providerId: provider._id,
            categoryId: new Types.ObjectId(dto.categoryId),
            title: dto.title,
            description: dto.description,
            durationMinutes: dto.durationMinutes,
            costPrice: dto.costPrice,
            sellingPrice: dto.sellingPrice,
            offeredPrice: dto.offeredPrice,
            serviceType: dto.serviceType,
            images: imageIds,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return ApiResponse.success('Service created successfully', service);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateService(
    userId: string,
    serviceId: string,
    dto: UpdateServiceDTO,
    files?: Express.Multer.File[],
  ) {
    const session = await this.connection.startSession();
    const oldImageIds: string[] = [];

    try {
      session.startTransaction();

      const provider = await this.serviceProviderModel
        .findOne({
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .session(session);

      if (!provider) {
        throw new NotFoundException('Service provider profile not found');
      }

      const service = await this.serviceModel
        .findOne({
          _id: new Types.ObjectId(serviceId),
          providerId: provider._id,
        })
        .session(session);

      if (!service) {
        throw new NotFoundException('Service not found');
      }

      const filtered = this.filterDto(dto);

      if (dto.categoryId) {
        filtered.categoryId = new Types.ObjectId(dto.categoryId);
      }

      // If new images are uploaded, replace old images
      if (files && files.length > 0) {
        // Save old images for post-commit cleanup
        if (service.images && service.images.length > 0) {
          service.images.forEach((imgId) =>
            oldImageIds.push(imgId.toString()),
          );
        }

        const newImageIds: Types.ObjectId[] = [];
        for (const file of files) {
          const uploaded = await this.documentService.upload(
            file,
            MediaFolderName.ServiceImages,
            userId,
            undefined,
            session,
          );
          newImageIds.push(uploaded._id);
        }
        filtered.images = newImageIds;
      }

      Object.assign(service, filtered);
      await service.save({ session });
      await session.commitTransaction();

      // Delete old images AFTER commit
      for (const oldId of oldImageIds) {
        try {
          await this.documentService.deleteMedia(oldId);
        } catch (err) {
          console.error('Failed to delete old service image:', err);
        }
      }

      return ApiResponse.success('Service updated successfully', service);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async deleteService(userId: string, serviceId: string) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const provider = await this.serviceProviderModel
        .findOne({
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .session(session);

      if (!provider) {
        throw new NotFoundException('Service provider profile not found');
      }

      const service = await this.serviceModel
        .findOne({
          _id: new Types.ObjectId(serviceId),
          providerId: provider._id,
        })
        .session(session);

      if (!service) {
        throw new NotFoundException('Service not found');
      }

      const imageIds = service.images
        ? service.images.map((id) => id.toString())
        : [];

      await service.deleteOne({ session });
      await session.commitTransaction();

      // Delete media after commit
      for (const imgId of imageIds) {
        try {
          await this.documentService.deleteMedia(imgId);
        } catch (err) {
          console.error('Failed to delete service image:', err);
        }
      }

      return ApiResponse.success('Service deleted successfully');
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getServiceDetails(serviceId: string) {
    const service = await this.serviceModel
      .findById(new Types.ObjectId(serviceId))
      .populate('categoryId')
      .populate('providerId', 'businessName rating totalReviews')
      .populate('images');

    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return ApiResponse.success('Service details', service);
  }

  async listServices(categoryId?: string, providerId?: string) {
    const filter: any = { isActive: true };
    if (categoryId) {
      filter.categoryId = new Types.ObjectId(categoryId);
    }
    if (providerId) {
      filter.providerId = new Types.ObjectId(providerId);
    }

    const services = await this.serviceModel
      .find(filter)
      .populate('categoryId', 'name label')
      .populate('providerId', 'businessName rating')
      .populate('images')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success('Services list', services);
  }

  // ===================================================
  // SERVICE STAFF
  // ===================================================

  async addStaff(
    userId: string,
    dto: CreateStaffDTO,
    file?: Express.Multer.File,
  ) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const provider = await this.serviceProviderModel
        .findOne({
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .session(session);

      if (!provider) {
        throw new NotFoundException('Service provider profile not found');
      }

      const staffData: any = {
        providerId: provider._id,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        experienceYears: dto.experienceYears,
        skills: dto.skills,
      };

      if (file) {
        const uploaded = await this.documentService.upload(
          file,
          MediaFolderName.ServiceStaff,
          userId,
          undefined,
          session,
        );
        staffData.image = uploaded._id;
      }

      const [staff] = await this.serviceStaffModel.create([staffData], {
        session,
      });

      await session.commitTransaction();
      return ApiResponse.success('Staff added successfully', staff);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateStaff(
    userId: string,
    staffId: string,
    dto: UpdateStaffDTO,
    file?: Express.Multer.File,
  ) {
    const session = await this.connection.startSession();
    let oldImageId: string | null = null;

    try {
      session.startTransaction();

      const provider = await this.serviceProviderModel
        .findOne({
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .session(session);

      if (!provider) {
        throw new NotFoundException('Service provider profile not found');
      }

      const staff = await this.serviceStaffModel
        .findOne({
          _id: new Types.ObjectId(staffId),
          providerId: provider._id,
        })
        .session(session);

      if (!staff) {
        throw new NotFoundException('Staff not found');
      }

      const filtered = this.filterDto(dto);

      if (file) {
        if (staff.image) {
          oldImageId = staff.image.toString();
        }
        const uploaded = await this.documentService.upload(
          file,
          MediaFolderName.ServiceStaff,
          userId,
          undefined,
          session,
        );
        filtered.image = uploaded._id;
      }

      Object.assign(staff, filtered);
      await staff.save({ session });
      await session.commitTransaction();

      if (oldImageId) {
        try {
          await this.documentService.deleteMedia(oldImageId);
        } catch (err) {
          console.error('Failed to delete old staff image:', err);
        }
      }

      return ApiResponse.success('Staff updated successfully', staff);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async deleteStaff(userId: string, staffId: string) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const provider = await this.serviceProviderModel
        .findOne({
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .session(session);

      if (!provider) {
        throw new NotFoundException('Service provider profile not found');
      }

      const staff = await this.serviceStaffModel
        .findOne({
          _id: new Types.ObjectId(staffId),
          providerId: provider._id,
        })
        .session(session);

      if (!staff) {
        throw new NotFoundException('Staff not found');
      }

      const imageId = staff.image ? staff.image.toString() : null;

      await staff.deleteOne({ session });
      await session.commitTransaction();

      if (imageId) {
        try {
          await this.documentService.deleteMedia(imageId);
        } catch (err) {
          console.error('Failed to delete staff image:', err);
        }
      }

      return ApiResponse.success('Staff deleted successfully');
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async listStaff(providerId: string) {
    const staff = await this.serviceStaffModel
      .find({
        providerId: new Types.ObjectId(providerId),
        isActive: true,
      })
      .populate('image')
      .lean();

    return ApiResponse.success('Staff list', staff);
  }

  async getStaffDetails(providerId: string, staffId: string) {
    const staff = await this.serviceStaffModel
      .findOne({ providerId: new Types.ObjectId(providerId), _id: new Types.ObjectId(staffId) })
      .populate('image')
      .lean();

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return ApiResponse.success('Staff details fetched successfully', staff);
  }

  // ===================================================
  // AVAILABILITY & SLOTS
  // ===================================================

  async createProviderAvailability(
    userId: string,
    dto: CreateProviderAvailabilityDTO,
  ) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const provider = await this.serviceProviderModel
        .findOne({
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .session(session);

      if (!provider) {
        throw new NotFoundException('Service provider profile not found');
      }

      // const availability = await this.providerAvailabilityModel.create([dto], {
      //   session,
      // });
      const availabilityDocs = dto.availabilities.map((availability) => ({
        providerId: provider._id,
        dayOfWeek: availability.dayOfWeek,
        startTime: availability.startTime,
        endTime: availability.endTime,
        breakStart: availability.breakStart,
        breakEnd: availability.breakEnd,
      }));

      const createdAvailability = await this.providerAvailabilityModel.insertMany(
        dto.availabilities.map((item) => ({
          providerId: provider._id,
          ...item,
        })),
        { session }
      );

      await session.commitTransaction();
      return ApiResponse.success('Availability created successfully', createdAvailability);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateAvailability(userId: string, dtos: UpdateAvailabilityDTO[]) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const provider = await this.serviceProviderModel
        .findOne({
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .session(session);

      if (!provider) {
        throw new NotFoundException('Service provider profile not found');
      }

      // Remove old availability records for this provider
      await this.providerAvailabilityModel.deleteMany(
        { providerId: provider._id },
        { session },
      );

      // Insert new availability records
      const records = dtos.map((d) => ({
        providerId: provider._id,
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
        breakStart: d.breakStart,
        breakEnd: d.breakEnd,
      }));

      await this.providerAvailabilityModel.insertMany(
        records,
        { session },
      );

      await session.commitTransaction();

      return ApiResponse.success(
        'Availability updated successfully',
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getAvailability(providerId: string) {
    const availability = await this.providerAvailabilityModel
      .find({ providerId: new Types.ObjectId(providerId) })
      .sort({ dayOfWeek: 1 })
      .lean();

    return ApiResponse.success('Provider availability', availability);
  }

  // async getAvailableSlots(
  //   providerId: string,
  //   serviceId: string,
  //   date: string,
  // ) {
  //   const bookingDate = new Date(date || Date.now());
  //   const dayOfWeek = getWeekDay(bookingDate);

  //   const service = await this.serviceModel.findById(
  //     new Types.ObjectId(serviceId),
  //   );

  //   if (!service) {
  //     throw new NotFoundException('Service not found');
  //   }

  //   const availability = await this.providerAvailabilityModel.findOne({
  //     providerId: new Types.ObjectId(providerId),
  //     dayOfWeek,
  //   });

  //   if (!availability) {
  //     return ApiResponse.success('No availability for this day', []);
  //   }

  //   const startOfDay = new Date(bookingDate);
  //   startOfDay.setHours(0, 0, 0, 0);

  //   const endOfDay = new Date(bookingDate);
  //   endOfDay.setHours(23, 59, 59, 999);

  //   const existingBookings = await this.serviceBookingModel
  //     .find({
  //       providerId: new Types.ObjectId(providerId),
  //       bookingDate: {
  //         $gte: startOfDay,
  //         $lte: endOfDay,
  //       },
  //       bookingStatus: {
  //         $in: [
  //           BookingStatus.PENDING,
  //           BookingStatus.CONFIRMED,
  //           BookingStatus.ONGOING,
  //         ],
  //       },
  //     })
  //     .lean();

  //   const slots = this.generateTimeSlots(
  //     availability.startTime,
  //     availability.endTime,
  //     availability.breakStart,
  //     availability.breakEnd,
  //     existingBookings,
  //     service.durationMinutes,
  //   );

  //   return ApiResponse.success('Available slots', slots);
  // }
  // private generateTimeSlots(
  //   startTime: string,
  //   endTime: string,
  //   breakStart?: string,
  //   breakEnd?: string,
  //   existingBookings: any[] = [],
  //   serviceDuration = 30,
  // ) {
  //   const slots: {
  //     startTime: string;
  //     endTime: string;
  //     isAvailable: boolean;
  //   }[] = [];

  //   const SLOT_INTERVAL = 30;

  //   const toMinutes = (time: string) => {
  //     const [h, m] = time.split(':').map(Number);
  //     return h * 60 + m;
  //   };

  //   const toTimeString = (minutes: number) => {
  //     const hours = Math.floor(minutes / 60);
  //     const mins = minutes % 60;

  //     return `${hours.toString().padStart(2, '0')}:${mins
  //       .toString()
  //       .padStart(2, '0')}`;
  //   };

  //   const start = toMinutes(startTime);
  //   const end = toMinutes(endTime);

  //   const breakStartMin = breakStart
  //     ? toMinutes(breakStart)
  //     : null;

  //   const breakEndMin = breakEnd
  //     ? toMinutes(breakEnd)
  //     : null;

  //   for (
  //     let current = start;
  //     current + serviceDuration <= end;
  //     current += SLOT_INTERVAL
  //   ) {
  //     const slotStart = current;
  //     const slotEnd = current + serviceDuration;

  //     // Break overlap
  //     if (
  //       breakStartMin !== null &&
  //       breakEndMin !== null &&
  //       slotStart < breakEndMin &&
  //       slotEnd > breakStartMin
  //     ) {
  //       continue;
  //     }

  //     // Existing booking overlap
  //     const isBooked = existingBookings.some((booking) => {
  //       const bookingStart = toMinutes(
  //         booking.slotStartTime,
  //       );

  //       const bookingEnd = toMinutes(
  //         booking.slotEndTime,
  //       );

  //       return (
  //         slotStart < bookingEnd &&
  //         slotEnd > bookingStart
  //       );
  //     });

  //     slots.push({
  //       startTime: toTimeString(slotStart),
  //       endTime: toTimeString(slotEnd),
  //       isAvailable: !isBooked,
  //     });
  //   }

  //   return slots;
  // }

  async getAvailableSlots(
    providerId: string,
    serviceId: string,
    date: string,
  ) {
    console.log("Date", date)
    const bookingDate = new Date(date || Date.now());
    const dayOfWeek = getWeekDay(bookingDate);

    const service = await this.serviceModel.findById(
      new Types.ObjectId(serviceId),
    );

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const availability = await this.providerAvailabilityModel.findOne({
      providerId: new Types.ObjectId(providerId),
      dayOfWeek,
    });

    if (!availability) {
      return ApiResponse.success('No availability for this day', []);
    }

    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await this.serviceBookingModel
      .find({
        providerId: new Types.ObjectId(providerId),
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
      .lean();

    const staff = await this.serviceStaffModel
      .find({
        providerId: new Types.ObjectId(providerId),
        isActive: true,
        skills: service.title, // assuming skills contain service names
      }).populate("image")
      .select('_id name image')
      .lean();

    const slots = this.generateTimeSlots(
      availability.startTime,
      availability.endTime,
      availability.breakStart,
      availability.breakEnd,
      existingBookings,
      staff,
      service.durationMinutes,
    );

    return ApiResponse.success('Available slots', slots);
  }

  private generateTimeSlots(
    startTime: string,
    endTime: string,
    breakStart: string | undefined,
    breakEnd: string | undefined,
    existingBookings: any[],
    staff: any[],
    serviceDuration: number,
  ) {
    const slots: any[] = [];

    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const toTimeString = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;

      return `${h.toString().padStart(2, '0')}:${m
        .toString()
        .padStart(2, '0')}`;
    };

    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    const breakStartMin = breakStart
      ? toMinutes(breakStart)
      : null;

    const breakEndMin = breakEnd
      ? toMinutes(breakEnd)
      : null;

    for (
      let current = start;
      current + serviceDuration <= end;
      current += serviceDuration
    ) {
      const slotStart = current;
      const slotEnd = current + serviceDuration;

      if (
        breakStartMin !== null &&
        breakEndMin !== null &&
        slotStart < breakEndMin &&
        slotEnd > breakStartMin
      ) {
        continue;
      }

      const availableStaff = staff.filter((staffMember) => {


        const hasBooking = existingBookings.some((booking) => {
          console.log("Available Staff", booking.staffId, staffMember._id)
          if (
            booking.staffId?.toString() !==
            staffMember._id.toString()
          ) {
            return false;
          }

          const bookingStart = toMinutes(
            booking.slotStartTime,
          );

          const bookingEnd = toMinutes(
            booking.slotEndTime,
          );

          return (
            slotStart < bookingEnd &&
            slotEnd > bookingStart
          );
        });

        return !hasBooking;
      });

      slots.push({
        startTime: toTimeString(slotStart),
        endTime: toTimeString(slotEnd),
        isAvailable: availableStaff.length > 0,
        availableStaff,
      });
    }

    return slots;
  }

  // ===================================================
  // BOOKING (Moved to ServiceBookingService)
  // ===================================================

  // ===================================================
  // REVIEWS
  // ===================================================

  async createReview(userId: string, dto: CreateReviewDTO) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const booking = await this.serviceBookingModel
        .findById(new Types.ObjectId(dto.bookingId))
        .session(session);

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.userId.toString() !== userId) {
        throw new ForbiddenException('You can only review your own bookings');
      }

      if (booking.bookingStatus !== BookingStatus.COMPLETED) {
        throw new BadRequestException(
          'You can only review completed bookings',
        );
      }

      // Check if review already exists for this booking
      const existingReview = await this.serviceReviewModel
        .findOne({ bookingId: booking._id })
        .session(session);

      if (existingReview) {
        throw new BadRequestException(
          'You have already reviewed this booking',
        );
      }

      const [review] = await this.serviceReviewModel.create(
        [
          {
            userId: new Types.ObjectId(userId),
            bookingId: booking._id,
            providerId: booking.providerId,
            rating: dto.rating,
            review: dto.review,
          },
        ],
        { session },
      );

      // Recalculate provider rating
      const allReviews = await this.serviceReviewModel
        .find({ providerId: booking.providerId })
        .session(session);

      const totalReviews = allReviews.length;
      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

      await this.serviceProviderModel.updateOne(
        { _id: booking.providerId },
        {
          $set: {
            rating: Math.round(avgRating * 10) / 10,
            totalReviews,
          },
        },
        { session },
      );

      await session.commitTransaction();
      return ApiResponse.success('Review submitted successfully', review);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // ===================================================
  // LEADS
  // ===================================================

  async createLead(userId: string, dto: CreateLeadDTO) {
    const user = await this.userModel.findById(new Types.ObjectId(userId));
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const lead = await this.serviceLeadModel.create({ userId: new Types.ObjectId(userId), name: user.name, email: user.email, ...dto });

    return ApiResponse.success(
      'Lead created successfully',
      lead,
    );
  }


  async userListLeads(userId: string, categoryId?: string) {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (categoryId) {
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    const leads = await this.serviceLeadModel
      .find(filter)
      .populate('userId', 'name email phone')
      .populate('categoryId', 'name label')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success('Leads list', leads);
  }



  // ===================================================
  // WALLET & PAYOUT
  // ===================================================

  async getWallet(userId: string) {
    const provider = await this.getProviderByUserId(userId);
    const wallet = await this.serviceProviderWalletModel
      .findOne({ providerId: provider._id })
      .lean();

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return ApiResponse.success('Wallet details', wallet);
  }

  async requestPayout(userId: string, dto: RequestPayoutDTO) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const provider = await this.serviceProviderModel
        .findOne({
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .session(session);

      if (!provider) {
        throw new NotFoundException('Service provider profile not found');
      }

      const wallet = await this.serviceProviderWalletModel
        .findOne({ providerId: provider._id })
        .session(session);

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (wallet.availableBalance < dto.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Move funds from available to pending
      wallet.availableBalance -= dto.amount;
      wallet.pendingBalance += dto.amount;
      await wallet.save({ session });

      // Create payout request
      const [payout] = await this.serviceProviderPayoutModel.create(
        [
          {
            providerId: provider._id,
            amount: dto.amount,
            status: ServiceProviderPayoutStatus.PENDING,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return ApiResponse.success('Payout requested successfully', payout);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async processPayout(payoutId: string, dto: ProcessPayoutDTO) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const payout = await this.serviceProviderPayoutModel
        .findById(new Types.ObjectId(payoutId))
        .session(session);

      if (!payout) {
        throw new NotFoundException('Payout not found');
      }

      if (payout.status === ServiceProviderPayoutStatus.PAID) {
        throw new BadRequestException('Payout is already processed');
      }

      payout.status = ServiceProviderPayoutStatus.PAID;
      payout.transactionId = dto.transactionId;
      payout.paidAt = new Date();
      await payout.save({ session });

      // Remove from pending balance
      const wallet = await this.serviceProviderWalletModel
        .findOne({ providerId: payout.providerId })
        .session(session);

      if (wallet) {
        wallet.pendingBalance -= payout.amount;
        await wallet.save({ session });
      }

      await session.commitTransaction();
      return ApiResponse.success('Payout processed successfully', payout);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
