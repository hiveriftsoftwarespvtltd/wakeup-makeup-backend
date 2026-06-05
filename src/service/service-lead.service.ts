import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { ServiceLead, ServiceLeadDocument, ServiceLeadStatus } from './schema/service-lead.schema';
import { ServiceProvider, ServiceProviderDocument } from './schema/service-provider.schema';
import { ApiResponse } from 'src/common/responses/api-response';
import { ServiceBooking, ServiceBookingDocument, BookingStatus } from './schema/service-booking.schema';
import { Service, ServiceDocument } from './schema/service.schema';
import { calculateEndTime } from 'src/utils/helper';
import { BookLeadDTO } from './dto/service.dto';

@Injectable()
export class ServiceLeadService {
  constructor(
    @InjectModel(ServiceLead.name) private leadModel: Model<ServiceLeadDocument>,
    @InjectModel(ServiceProvider.name) private providerModel: Model<ServiceProviderDocument>,
    @InjectModel(ServiceBooking.name) private bookingModel: Model<ServiceBookingDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectConnection() private connection: Connection
  ) { }

  async getAllLeadsForAdmin() {
    return this.leadModel.find()
      .populate('userId', 'name email phone avatar')
      .populate('categoryId', 'name label')
      .populate('assignedProviderId', 'businessName phone email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getLeadsForProvider(userId: string) {
    const provider = await this.providerModel.findOne({ userId });
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    const orConditions: any[] = [];

    if (provider.city) {
      orConditions.push({ city: provider.city });
    }

    if (provider.coordinates && provider.coordinates.length === 2 && (provider.coordinates[0] !== 0 || provider.coordinates[1] !== 0)) {
      orConditions.push({
        coordinates: {
          $geoWithin: {
            $centerSphere: [provider.coordinates, 50 / 6378.1] // 50km radius
          }
        }
      });
    }

    let query = {};
    if (orConditions.length > 0) {
      query = { $or: orConditions };
    } else {
      // If no city and no coordinates, maybe return empty or all?
      // Based on prompt: "only those which matches with his city or with 50km"
      // If neither is present, they shouldn't see leads that require location match.
      return [];
    }

    const leads = await this.leadModel.find(query)
      .populate('categoryId', 'name label')
      .sort({ createdAt: -1 })
      .exec();

    return leads.map(lead => {
      const leadObj: any = lead.toObject();
      if (leadObj.assignedProviderId?.toString() !== provider._id.toString()) {
        delete leadObj.email;
        delete leadObj.phoneNumber;
      }
      return leadObj;
    });
  }

  async deleteLeadByAdmin(userId: string, leadId: string) {
    const lead = await this.leadModel.findOne({ _id: leadId });
    if (!lead) {
      throw new NotFoundException('Lead not found or you are not authorized to delete it');
    }

    await this.leadModel.deleteOne({ _id: leadId });
    return { success: true, message: 'Lead deleted successfully' };
  }

  async applyToLead(userId: string, leadId: string) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const provider = await this.providerModel
        .findOne({
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .session(session);

      if (!provider) {
        throw new NotFoundException('Service provider profile not found');
      }

      const lead = await this.leadModel
        .findById(new Types.ObjectId(leadId))
        .session(session);

      if (!lead) {
        throw new NotFoundException('Lead not found');
      }

      if (lead.status !== ServiceLeadStatus.OPEN) {
        throw new BadRequestException('This lead is no longer open');
      }

      lead.status = ServiceLeadStatus.ASSIGNED;
      lead.assignedProviderId = provider._id as Types.ObjectId;
      await lead.save({ session });

      await session.commitTransaction();
      return ApiResponse.success('Lead applied successfully');
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async bookLead(providerUserId: string, leadId: string, dto: BookLeadDTO) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const provider = await this.providerModel
        .findOne({ userId: new Types.ObjectId(providerUserId), isDeleted: false })
        .session(session);

      if (!provider) {
        throw new NotFoundException('Service provider profile not found');
      }

      const lead = await this.leadModel
        .findById(new Types.ObjectId(leadId))
        .session(session);

      if (!lead) {
        throw new NotFoundException('Lead not found');
      }

      if (lead.assignedProviderId?.toString() !== provider._id.toString()) {
        throw new BadRequestException('Lead is not assigned to you');
      }

      if (lead.status === ServiceLeadStatus.BOOKED) {
        throw new BadRequestException('Lead is already booked');
      }

      const service = await this.serviceModel.findById(new Types.ObjectId(dto.serviceId)).session(session);
      if (!service || !service.isActive) {
        throw new NotFoundException('Service not found or inactive');
      }

      const bookingDate = new Date(dto.bookingDate);
      const slotEndTime = calculateEndTime(dto.slotStartTime, service.durationMinutes);
      const subtotal = service.offeredPrice || service.sellingPrice;

      // Update Lead Status
      lead.status = ServiceLeadStatus.BOOKED;
      await lead.save({ session });

      // Create Booking
      const [booking] = await this.bookingModel.create(
        [
          {
            userId: lead.userId,
            providerId: provider._id,
            serviceId: service._id,
            staffId: dto.staffId ? new Types.ObjectId(dto.staffId) : undefined,
            bookingDate,
            slotStartTime: dto.slotStartTime,
            slotEndTime,
            serviceAddress: lead.address,
            subtotal,
            couponDiscount: 0,
            influencerDiscount: 0,
            platformCommission: 0,
            totalAmount: subtotal,
            bookingStatus: BookingStatus.CONFIRMED,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return ApiResponse.success('Lead marked as booked and booking created successfully', booking);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
