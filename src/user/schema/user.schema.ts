import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  VENDOR = 'vendor',
  INFLUENCER = 'influencer',
  SERVICE_PROVIDER = 'service_provider',
  DISTRIBUTOR = 'distributor',
  USER = 'user',
  EDUCATOR = 'educator',
}

export enum AuthType {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ type: Types.ObjectId, ref: 'Media' })
  avatar?: Types.ObjectId;

  @Prop()
  password?: string;

  @Prop()
  phone?: string;

  @Prop({ type: [String], enum: AuthType, default: [AuthType.EMAIL] })
  authTypes!: AuthType[];

  @Prop()
  googleId?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Prop()
  otp?: string;

  @Prop()
  otpExpiresAt?: Date;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ default: false })
  isPhoneVerified!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Vendor' })
  vendorId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Influencer' })
  influencerId?: Types.ObjectId;

  @Prop({ default: false })
  isVendorOnboardingCompleted!: boolean;

  @Prop({ default: false })
  isServiceProviderOnboardingCompleted!: boolean;

  @Prop({ default: false })
  isDistributorOnboardingCompleted!: boolean;

  @Prop({ default: false })
  isInfluencerOnboardingCompleted!: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'ServiceProvider',
  })
  serviceProviderId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Distributor',
  })
  distributorId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Educator',
  })
  educatorId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "AffliateProgram" })
  affliateProgramId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Influencer' })
  referredByInfluencerId?: Types.ObjectId;

  @Prop({ default: false })
  isEducatorOnboardingCompleted!: boolean;

}

export const UserSchema = SchemaFactory.createForClass(User);
