import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Service, ServiceDocument } from './schema/service.schema';
import { Connection, Model, Types } from 'mongoose';
import {
  ProviderSubscription,
  ProviderSubscriptionDocument,
} from './schema/provider-subscription.schema';
import {
  ProviderAvailability,
  ProviderAvailabilityDocument,
} from './schema/service-availability.schema';
import {
  ServiceBooking,
  ServiceBookingDocument,
} from './schema/service-booking.schema';
import {
  ServiceCategory,
  ServiceCategoryDocument,
} from './schema/service-category.schema';
import { ServiceLead, ServiceLeadDocument } from './schema/service-lead.schema';
import {
  ServiceProviderPayoutDocument,
  ServicerProviderPayout,
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
} from './schema/service-provider.schema';
import {
  CreateServiceCategoryDTO,
  CreateServiceSubscriptionPlanDTO,
  UpdateServiceCategoryDTO,
} from './dto/service.dto';
import { DocumentService } from 'src/document/document.service';
import { ApiResponse } from 'src/common/responses/api-response';
import { MediaFolderName } from 'src/constants';
import { toSlug } from 'src/utils/helper';

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
    private serviceProviderWallet: Model<ServiceProviderWalletDocument>,
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
    private documentService: DocumentService,
    @InjectConnection() private connection: Connection,
  ) {}

  // Service Category
  async createServiceCategory(
    dto: CreateServiceCategoryDTO,
    file: Express.Multer.File,
    userId: string,
  ) {
    const isAlreadyExist = await this.serviceCategoryModel.findOne({
      $or: [{ name: dto.name }, { label: dto.label }],
    });
    if (!isAlreadyExist) {
      throw new BadRequestException('Name or Label already exist');
    }

    let mediaId: Types.ObjectId | undefined;
    if (file) {
      const uploaded = await this.documentService.upload(
        file,
        'service-category',
        userId,
      );
      mediaId = uploaded._id;
    }
    await this.serviceCategoryModel.create({
      name: dto.name,
      label: dto.label,
      description: dto.description,
      image: mediaId,
      isActive: dto?.isActive,
    });

    return ApiResponse.success('Service category created successfully');
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

      const filtered = Object.fromEntries(
        Object.entries(dto).filter(
          ([_, value]) =>
            value !== undefined &&
            value !== null &&
            !(typeof value === 'string' && value.trim() === ''),
        ),
      );

      if (file) {
        // Save old image id for later deletion
        if (serviceCategory.image) {
          oldImageId = serviceCategory.image.toString();
        }

        // Upload new image
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
      .find()
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
    const serviceCategory = await this.serviceCategoryModel.findById(
      new Types.ObjectId(serviceCategoryId),
    );
    if (!serviceCategory) {
      throw new NotFoundException('Service category not found');
    }

    if (serviceCategory.image) {
      await this.documentService.deleteMedia(serviceCategory.image.toString());
    }
    await serviceCategory.deleteOne();

    return ApiResponse.success('Service category deleted successfully');
  }

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
    dto: UpdateServiceCategoryDTO,
    serviceSubscriptionPlanId: string,
  ) {
    const subscriptionPlan = await this.serviceSubscriptionModel.findById(
      new Types.ObjectId(serviceSubscriptionPlanId),
    );
    if (!subscriptionPlan) {
      throw new NotFoundException('Subscription plan not found');
    }
    const filtered = Object.fromEntries(
      Object.entries(dto).filter(
        ([key, value]) =>
          value !== undefined &&
          value !== null &&
          typeof value === 'string' &&
          value.trim() === '',
      ),
    );

    Object.assign(subscriptionPlan, filtered);
    subscriptionPlan.save();
    return ApiResponse.success(`Subscription plan updated successfully`);
  }

  async allSubscriptionPlans() {
    return this.serviceSubscriptionModel.find().lean();
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
    const plan = await this.serviceSubscriptionModel.findById(planId).lean();
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    await plan.deleteOne();
    return ApiResponse.success('Plan deleted successfully');
  }
}
