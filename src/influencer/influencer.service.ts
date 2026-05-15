import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Influencer, InfluencerDocument } from './schema/influencer.schema';
import { CreateInfluencerDto, UpdateInfluencerDto } from './dto/influencer.dto';
import { User, UserDocument, UserRole } from 'src/user/schema/user.schema';
import { ApiResponse } from 'src/common/responses/api-response';

@Injectable()
export class InfluencerService {
  constructor(
    @InjectModel(Influencer.name)
    private influencerModel: Model<InfluencerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateInfluencerDto) {
  const user = await this.userModel.findOne({
    email: dto.email,
  });

  if (user) {
    throw new ConflictException(
      'User already exists with this email',
    );
  }

  const hashedPassword = await bcrypt.hash(
    dto.password,
    10,
  );

  const newUser = await this.userModel.create({
    name: dto.name,

    email: dto.email,

    password: hashedPassword,

    role: UserRole.INFLUENCER,

    isEmailVerified: true,
  });

  const influencer =
    await this.influencerModel.create({
      name: dto.name,

      bio: dto.bio,

      instagram: dto.instagram,

      youtube: dto.youtube,

      tiktok: dto.tiktok,

      commissionRate:
        dto.commissionRate || 5,

      userId: newUser._id,
    });

  return await this.influencerModel
    .findById(influencer._id)
    .populate('userId',"-password")
    .populate('coupons');
}

  async findAll() {
    return await this.influencerModel.find({ isDeleted: false }).populate("userId","-password").populate("coupons").lean();
  }

  async findOne(id: string) {
    const influencer = await this.influencerModel.findById(id).populate("userId","-password").populate("coupons").lean();

    if (!influencer) {
      throw new NotFoundException('Influencer not found');
    }

    return influencer;
  }

  async updateInfluencer(
  influencerId: string,
  dto: UpdateInfluencerDto,
) {
  const influencer =
    await this.influencerModel.findOne({
      userId: new Types.ObjectId(
        dto.userId,
      ),

      _id: new Types.ObjectId(
        influencerId,
      ),
    });

  if (!influencer) {
    throw new NotFoundException(
      'Influencer not found',
    );
  }

  if (dto.name !== undefined) {
    influencer.name = dto.name;
  }

  if (dto.bio !== undefined) {
    influencer.bio = dto.bio;
  }

  if (dto.instagram !== undefined) {
    influencer.instagram =
      dto.instagram;
  }

  if (dto.youtube !== undefined) {
    influencer.youtube = dto.youtube;
  }

  if (dto.tiktok !== undefined) {
    influencer.tiktok = dto.tiktok;
  }

  if (
    dto.commissionRate !== undefined
  ) {
    influencer.commissionRate =
      dto.commissionRate;
  }

  if (dto.status !== undefined) {
    influencer.status = dto.status;
  }

  if (dto.followers !== undefined) {
    influencer.followers =
      dto.followers;
  }

  if (dto.isActive !== undefined) {
    influencer.isActive =
      dto.isActive;
  }

  await influencer.save();

  return await this.influencerModel
    .findById(influencer._id)
    .populate('userId',"-password")
    .populate('coupons');
}

  async deleteInfluencer(influencerId:string){
    const influencer = await this.influencerModel.findById(new Types.ObjectId(influencerId))
    if(!influencer){
      throw new NotFoundException("Influencer Not Found")
    }

    const user = await this.userModel.findOne({_id:new Types.ObjectId(influencer.userId)})
    if(!user){
      throw new NotFoundException("User Not Found")
    }
    await Promise.all([user.deleteOne(),influencer.deleteOne()])
    
    return ApiResponse.success("Influencer Deleted Successfully")
  }

  async fetchInfluencerCoupons(
  influencerId: string,
) {
  const influencer =
    await this.influencerModel
      .findById(
        new Types.ObjectId(influencerId),
      )
      .populate('userId')
      .populate('coupons')
      .lean();

  if (!influencer) {
    throw new NotFoundException(
      'Influencer not found',
    );
  }

  return ApiResponse.success(
    'Influencer coupons fetched successfully',
    influencer,
  );
}
}
