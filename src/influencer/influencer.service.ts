import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';

import { Influencer, InfluencerDocument } from './schema/influencer.schema';
import {
  CreateInfluencerDto,
  createSlabDTO,
  UpdateInfluencerDto,
  UpdateSlabDTO,
} from './dto/influencer.dto';
import { User, UserDocument, UserRole } from 'src/user/schema/user.schema';
import { ApiResponse } from 'src/common/responses/api-response';
import {
  CommissionStatus,
  InfluencerCommission,
  InfluencerCommissionDocument,
} from './schema/influencer-commision-rate.schema';
import { Order, OrderDocument } from 'src/order/schema/order.schema';
import {
  InfluencerCommissionSlabDocument,
  influencerCommissonSlab,
} from './schema/influencer-commission-slab';
import {
  InfluencerPayout,
  InfluencerPayoutDocument,
  InfluencerPayoutStatus,
} from './schema/influencer-payout.schema';
import {
  InfluencerInvitation,
  InfluencerInvitationDocument,
} from './schema/influencer-invitation.schema';
import { sendMail } from 'src/utils/helper';
import { influencerInvitationTemplate } from 'src/utils/email.template';
import { randomUUID } from 'crypto';
import { InfluencerWalletService } from 'src/wallet/service/influencer/influencer.wallet.service';

@Injectable()
export class InfluencerService {
  constructor(
    @InjectModel(Influencer.name)
    private influencerModel: Model<InfluencerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(InfluencerCommission.name)
    private commissionModel: Model<InfluencerCommissionDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(influencerCommissonSlab.name)
    private slabModel: Model<InfluencerCommissionSlabDocument>,
    @InjectModel(InfluencerPayout.name)
    private influencerPayoutModel: Model<InfluencerPayoutDocument>,
    @InjectModel(InfluencerInvitation.name)
    private influencerInvitationModel: Model<InfluencerInvitationDocument>,
    @InjectConnection() private connection:Connection,
    private influencerWalletService: InfluencerWalletService
  ) {}

  // async create(dto: CreateInfluencerDto, token: string) {
  //   const invitation = await this.influencerInvitationModel.findOne({
  //     token,
  //     isUsed: false,
  //   });
  //   if (!invitation) {
  //     throw new BadRequestException('Invalid invitation link');
  //   }

  //   if (invitation.expiresAt < new Date()) {
  //     throw new BadRequestException('Invitation link has expired');
  //   }
  //   const user = await this.userModel.findOne({
  //     email: dto.email,
  //   });

  //   if (user) {
  //     throw new ConflictException('User already exists with this email');
  //   }

  //   const hashedPassword = await bcrypt.hash(dto.password, 10);

  //   const newUser = await this.userModel.create({
  //     name: dto.name,

  //     email: dto.email,

  //     password: hashedPassword,

  //     role: UserRole.INFLUENCER,

  //     isEmailVerified: true,
  //   });

  //   const influencer = await this.influencerModel.create({
  //     name: dto.name,

  //     bio: dto.bio,

  //     instagram: dto.instagram,

  //     youtube: dto.youtube,

  //     tiktok: dto.tiktok,

  //     // commissionRate:
  //     //   dto.commissionRate || 5,

  //     userId: newUser._id,
  //   });

  //   newUser.influencerId = influencer._id;
  //   await newUser.save();

  //   invitation.isUsed = true;
  //   invitation.usedAt = new Date();
  //   await invitation.save();

  //   return await this.influencerModel
  //     .findById(influencer._id)
  //     .populate('userId', '-password')
  //     .populate('coupons');
  // }

  async create(
  dto: CreateInfluencerDto,
  // token: string,
) {
  const session =
    await this.connection.startSession();

  try {
    session.startTransaction();

    const invitation =
      await this.influencerInvitationModel.findOne({
        token:dto.token,
        isUsed: false,
      });

    if (!invitation) {
      throw new BadRequestException(
        'Invalid invitation link',
      );
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException(
        'Invitation link has expired',
      );
    }

    const existingUser =
      await this.userModel.findOne({
        email: invitation.email,
      });

    if (existingUser) {
      throw new BadRequestException(
        'User already exists with this email',
      );
    }

    const hashedPassword =
      await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create(
      [
        {
          name: invitation.name,
          email: invitation.email,
          password: hashedPassword,
          role: UserRole.INFLUENCER,
          isEmailVerified: true,
          isActive: true,
        },
      ],
      { session },
    );

    const influencer =
      await this.influencerModel.create(
        [
          {
            userId: user[0]._id,
            name: invitation.name,
            bio: dto.bio,
            instagram: dto.instagram,
            youtube: dto.youtube,
            tiktok: dto.tiktok,
            followers: dto.followers || 0,
          },
        ],
        { session },
      );

    await this.userModel.updateOne(
      {
        _id: user[0]._id,
      },
      {
        influencerId: influencer[0]._id,
      },
      { session },
    );

    await this.influencerInvitationModel.updateOne(
      {
        _id: invitation._id,
      },
      {
        isUsed: true,
        usedAt: new Date(),
      },
      { session },
    );

    await session.commitTransaction();

    await this.influencerWalletService.initializeWallet(influencer[0]._id.toString());

    return await this.influencerModel
      .findById(influencer[0]._id)
      .populate('userId', '-password')
      .populate('coupons');
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
  async findAll() {
    return await this.influencerModel
      .find({ isDeleted: false })
      .populate('userId', '-password')
      .populate('coupons')
      .lean();
  }

  async findOne(id: string) {
    const influencer = await this.influencerModel
      .findById(id)
      .populate('userId', '-password')
      .populate('coupons')
      .lean();

    if (!influencer) {
      throw new NotFoundException('Influencer not found');
    }

    return influencer;
  }

  async updateInfluencer(influencerId: string, dto: UpdateInfluencerDto) {
    const influencer = await this.influencerModel.findOne({
      userId: new Types.ObjectId(dto.userId),

      _id: new Types.ObjectId(influencerId),
    });

    if (!influencer) {
      throw new NotFoundException('Influencer not found');
    }

    if (dto.name !== undefined) {
      influencer.name = dto.name;
    }

    if (dto.bio !== undefined) {
      influencer.bio = dto.bio;
    }

    if (dto.instagram !== undefined) {
      influencer.instagram = dto.instagram;
    }

    if (dto.youtube !== undefined) {
      influencer.youtube = dto.youtube;
    }

    if (dto.tiktok !== undefined) {
      influencer.tiktok = dto.tiktok;
    }

    // if (
    //   dto.commissionRate !== undefined
    // ) {
    //   influencer.commissionRate =
    //     dto.commissionRate;
    // }

    if (dto.status !== undefined) {
      influencer.status = dto.status;
    }

    if (dto.followers !== undefined) {
      influencer.followers = dto.followers;
    }

    if (dto.isActive !== undefined) {
      influencer.isActive = dto.isActive;
    }

    await influencer.save();

    return await this.influencerModel
      .findById(influencer._id)
      .populate('userId', '-password')
      .populate('coupons');
  }

  async deleteInfluencer(influencerId: string) {
    const influencer = await this.influencerModel.findById(
      new Types.ObjectId(influencerId),
    );
    if (!influencer) {
      throw new NotFoundException('Influencer Not Found');
    }

    const user = await this.userModel.findOne({
      _id: new Types.ObjectId(influencer.userId),
    });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    await Promise.all([user.deleteOne(), influencer.deleteOne()]);

    return ApiResponse.success('Influencer Deleted Successfully');
  }

  async fetchInfluencerCoupons(influencerId: string) {
    const influencer = await this.influencerModel
      .findById(new Types.ObjectId(influencerId))
      .populate('userId')
      .populate('coupons')
      .lean();

    if (!influencer) {
      throw new NotFoundException('Influencer not found');
    }

    return ApiResponse.success(
      'Influencer coupons fetched successfully',
      influencer,
    );
  }

  async overview(influencerId: string) {
    const objectId = new Types.ObjectId(influencerId);

    const stats = await this.commissionModel.aggregate([
      {
        $match: {
          influencerId: objectId,
        },
      },
      {
        $group: {
          _id: null,

          totalSales: {
            $sum: '$finalOrderAmount',
          },

          totalCommission: {
            $sum: '$commissionAmount',
          },

          pendingCommission: {
            $sum: {
              $cond: [
                {
                  $eq: ['$isSettled', false],
                },
                '$commissionAmount',
                0,
              ],
            },
          },

          totalOrders: {
            $sum: 1,
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalSales: 0,
        totalCommission: 0,
        pendingCommission: 0,
        totalOrders: 0,
      }
    );
  }

  async influencerAnalytics(influencerId: string, days = 30) {
    days = Number(days) || 30;

    const startDate = new Date();

    startDate.setDate(startDate.getDate() - days);

    const objectInfluencerId = new Types.ObjectId(influencerId);

    const [commissionStats, couponUsageStats, recentOrders] = await Promise.all(
      [
        this.commissionModel.aggregate([
          {
            $match: {
              influencerId: objectInfluencerId,

              createdAt: {
                $gte: startDate,
              },
            },
          },

          {
            $group: {
              _id: null,

              totalCommission: {
                $sum: '$commissionAmount',
              },

              pendingCommission: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$status', CommissionStatus.PENDING],
                    },
                    '$commissionAmount',
                    0,
                  ],
                },
              },

              paidCommission: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$status', CommissionStatus.PAID],
                    },
                    '$commissionAmount',
                    0,
                  ],
                },
              },

              totalOrders: {
                $sum: 1,
              },
            },
          },
        ]),

        this.orderModel.aggregate([
          {
            $match: {
              'appliedCoupon.influencerId': objectInfluencerId,

              createdAt: {
                $gte: startDate,
              },
            },
          },

          {
            $group: {
              _id: null,

              totalCouponUsed: {
                $sum: 1,
              },

              totalSales: {
                $sum: '$finalOrderAmount',
              },
            },
          },
        ]),

        this.orderModel.aggregate([
          {
            $match: {
              'appliedCoupon.influencerId': objectInfluencerId,

              createdAt: {
                $gte: startDate,
              },
            },
          },

          {
            $sort: {
              createdAt: -1,
            },
          },

          {
            $limit: 5,
          },

          {
            $project: {
              _id: 1,

              orderNumber: 1,

              grandTotal: 1,

              createdAt: 1,

              paymentStatus: 1,

              orderStatus: 1,
            },
          },
        ]),
      ],
    );

    return {
      duration: `${days} days`,

      totalCommission: commissionStats[0]?.totalCommission || 0,

      pendingCommission: commissionStats[0]?.pendingCommission || 0,

      paidCommission: commissionStats[0]?.paidCommission || 0,

      totalOrders: commissionStats[0]?.totalOrders || 0,

      couponUsed: couponUsageStats[0]?.totalCouponUsed || 0,

      totalSales: couponUsageStats[0]?.totalSales || 0,

      recentOrders,
    };
  }

  async getCommissionSlab(totalSales: number) {
    const slab = await this.slabModel.findOne({
      minSales: { $lte: totalSales },
      maxSales: { $gte: totalSales },
      isActive: true,
    });

    if (!slab) {
      return {
        commissionRate: 0,
      };
    }

    return slab;
  }

  async calculateMonthlySales(
    influencerId: string,
    month: number,
    year: number,
  ) {
    const sales = await this.commissionModel.aggregate([
      {
        $match: {
          influencerId: new Types.ObjectId(influencerId),
          commissionMonth: month,
          commissionYear: year,
          status: {
            $in: [CommissionStatus.APPROVED, CommissionStatus.PAID],
          },
        },
      },

      {
        $group: {
          _id: null,

          totalSales: {
            $sum: '$finalOrderAmount',
          },

          totalProfit: {
            $sum: '$grossProfit',
          },

          totalOrders: {
            $sum: 1,
          },
        },
      },
    ]);

    return (
      sales[0] || {
        totalSales: 0,
        totalProfit: 0,
        totalOrders: 0,
      }
    );
  }

  // async settleMonthlyCommission(
  //   influencerId: string,
  //   month: number,
  //   year: number,
  // ) {
  //   const stats = await this.calculateMonthlySales(influencerId, month, year);

  //   const slab = await this.getCommissionSlab(stats.totalSales);

  //   const totalCommission = (stats.totalProfit * slab.commissionRate) / 100;

  //   const payout = await this.influencerPayoutModel.create({
  //     influencerId: new Types.ObjectId(influencerId),

  //     influencerUserId: influencer.userId,

  //     totalOrders: stats.totalOrders,

  //     totalSales: stats.totalSales,

  //     totalProfit: stats.totalProfit,

  //     commissionRate: slab.commissionRate,

  //     totalCommission,

  //     payoutMonth: month,

  //     payoutYear: year,
  //   });

  //   await this.commissionModel.updateMany(
  //     {
  //       influencerId: new Types.ObjectId(influencerId),

  //       commissionMonth: month,

  //       commissionYear: year,

  //       isSettled: false,
  //     },

  //     {
  //       $set: {
  //         isSettled: true,
  //         settledAt: new Date(),
  //       },
  //     },
  //   );

  //   return payout;
  // }

  async markPayoutPaid(payoutId: string, transactionId: string) {
    const payout = await this.influencerPayoutModel.findById(payoutId);

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    payout.status = InfluencerPayoutStatus.PAID;

    payout.transactionId = transactionId;

    payout.paidAt = new Date();

    await payout.save();

    await this.commissionModel.updateMany(
      {
        influencerId: payout.influencerId,

        commissionMonth: payout.payoutMonth,

        commissionYear: payout.payoutYear,
      },

      {
        $set: {
          status: CommissionStatus.PAID,
        },
      },
    );

    return payout;
  }

  async approveCommission(vendorOrderId: string) {
    await this.commissionModel.updateMany(
      {
        vendorOrderId: new Types.ObjectId(vendorOrderId),

        status: CommissionStatus.PENDING,
      },

      {
        $set: {
          status: CommissionStatus.APPROVED,
        },
      },
    );
  }

  async reverseCommission(vendorOrderId: string, reason: string) {
    await this.commissionModel.updateMany(
      {
        vendorOrderId: new Types.ObjectId(vendorOrderId),
      },

      {
        $set: {
          status: CommissionStatus.REVERSED,

          isReversed: true,

          reversedAt: new Date(),

          reversalReason: reason,
        },
      },
    );
  }

  async createSlab(dto: createSlabDTO) {
    if (dto.minSales >= dto.maxSales) {
      throw new BadRequestException('Maxsales should be greater than Minsales');
    }
    const overlappingSlab = await this.slabModel.findOne({
      isActive: true,
      minSales: { $lte: dto.maxSales },
      maxSales: { $gte: dto.minSales },
    });

    if (overlappingSlab) {
      throw new BadRequestException(
        `Slab overlapping with existing slab ${overlappingSlab.minSales} - ${overlappingSlab.maxSales}`,
      );
    }

    const slab = await this.slabModel.create({
      minSales: dto.minSales,
      maxSales: dto.maxSales,
      commissionRate: dto.commissionRate,
    });

    return ApiResponse.success(
      `Slab created for range ${slab.minSales}-${slab.maxSales} with commissionRate ${slab.commissionRate}`,
    );
  }

  async updateSlab(slabId: string, dto: UpdateSlabDTO) {
    const slab = await this.slabModel.findById(new Types.ObjectId(slabId));

    if (!slab) {
      throw new NotFoundException('Slab not found');
    }

    const minSales = dto.minSales ?? slab.minSales;

    const maxSales = dto.maxSales ?? slab.maxSales;

    if (maxSales <= minSales) {
      throw new BadRequestException(
        'Max sales should be greater than Min sales',
      );
    }

    // check overlapping slabs
    const overlapping = await this.slabModel.findOne({
      _id: { $ne: slab._id },
      isActive: true,

      minSales: { $lte: maxSales },
      maxSales: { $gte: minSales },
    });

    if (overlapping) {
      throw new BadRequestException(
        `Slab is overlapping with slab ${overlapping.minSales} - ${overlapping.maxSales}`,
      );
    }

    const filteredObject = Object.fromEntries(
      Object.entries(dto).filter(
        ([_, value]) => value !== undefined && value !== null,
      ),
    );

    const updatedSlab = await this.slabModel.findByIdAndUpdate(
      slab._id,
      filteredObject,
      { new: true },
    );

    return updatedSlab;
  }

  async getAllCommissionSlabs() {
    const slabs = await this.slabModel.find().lean();
    return ApiResponse.success('All Slabs', slabs);
  }

  async getCommissionSlabDetails(slabId: string) {
    const slab = await this.slabModel.findById(new Types.ObjectId(slabId));
    if (!slab) {
      throw new NotFoundException('Slab not found');
    }

    return ApiResponse.success('Slab details', slab);
  }

  async deleteSlab(slabId: string) {
    const slab = await this.slabModel.findById(new Types.ObjectId(slabId));
    if (!slab) {
      throw new NotFoundException('Slab not found');
    }

    await slab.deleteOne();
    return ApiResponse.success('Slab deleted successfully');
  }

  async sendInfluencerInvitationLink(
    email: string,
    name: string,
    adminId?: string,
  ) {
    email = email.toLowerCase().trim();

    const existingUser = await this.userModel.findOne({
      email,
      isDeleted: false,
    });

    if (existingUser) {
      throw new BadRequestException('User already exists with this email');
    }

    // Remove expired invitations
    await this.influencerInvitationModel.deleteMany({
      email,
      expiresAt: {
        $lt: new Date(),
      },
    });

    const token = randomUUID();

    const registrationUrl =
      process.env.NODE_ENV === 'production'
        ? `https://wakeup-makeup.com/influencer/registration?token=${token}`
        : `http://localhost:5173/influencer/registration?token=${token}`;

    const invitation = await this.influencerInvitationModel.findOneAndUpdate(
      {
        email,
        isUsed: false,
      },
      {
        $set: {
          name,
          token,
          invitedBy: adminId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    await sendMail(
      email,
      'WakeUp MakeUp - Influencer Invitation',
      influencerInvitationTemplate(name, registrationUrl),
    );

    return ApiResponse.success('Invitation sent successfully', {
      invitationId: invitation._id,
      expiresAt: invitation.expiresAt,
    });
  }
}
