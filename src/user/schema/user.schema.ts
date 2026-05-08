import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  VENDOR = 'vendor',
  INFLUENCER = 'influencer',
  DISTRIBUTOR = 'distributor',
  USER = 'user'
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

  @Prop({type:Types.ObjectId,ref:"Media"})
  avatar?:Types.ObjectId


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

  @Prop({default:false})
  isDeleted!:boolean

 
  @Prop({ type: Types.ObjectId, ref: 'Tenant' })
  vendorId?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);